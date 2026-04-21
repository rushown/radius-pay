'use strict';

const { validationResult } = require('express-validator');
const { Claim }            = require('../models/Claim');

/** POST /api/claims */
async function createClaim(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
  }

  const { claimId, amountRaw, creatorAddress, expiresAt, txHash } = req.body;

  try {
    if (Claim.exists(claimId)) {
      return res.status(409).json({ message: 'Claim already registered' });
    }

    const claim = Claim.create({ claimId, amountRaw, creatorAddress, expiresAt, txHash });
    return res.status(201).json(claim);
  } catch (err) {
    console.error('[createClaim] error:', err.code ?? err.message);
    return res.status(500).json({ message: 'Failed to create claim' });
  }
}

/** GET /api/claims/user/:address */
async function getUserClaims(req, res) {
  const { address } = req.params;
  if (!/^0x[0-9a-fA-F]{40}$/.test(address)) {
    return res.status(400).json({ message: 'Invalid address' });
  }
  try {
    const claims = Claim.findByUser(address);
    return res.json(claims);
  } catch (err) {
    console.error('[getUserClaims] error:', err.message);
    return res.status(500).json({ message: 'Failed to fetch claims' });
  }
}

/** GET /api/claims/:claimId */
async function getClaimById(req, res) {
  const { claimId } = req.params;
  if (!/^0x[0-9a-fA-F]{64}$/.test(claimId)) {
    return res.status(400).json({ message: 'Invalid claimId' });
  }
  try {
    const claim = Claim.findById(claimId);
    if (!claim) return res.status(404).json({ message: 'Claim not found' });
    return res.json(claim);
  } catch (err) {
    console.error('[getClaimById] error:', err.message);
    return res.status(500).json({ message: 'Failed to fetch claim' });
  }
}

/** POST /api/claims/verify
 *  Checks status only — the secret is NOT sent to the backend.
 */
async function verifyClaim(req, res) {
  const { claimId } = req.body;
  if (!claimId || !/^0x[0-9a-fA-F]{64}$/.test(claimId)) {
    return res.status(400).json({ message: 'Invalid claimId' });
  }
  try {
    const claim = Claim.findById(claimId);
    if (!claim) return res.json({ valid: false, status: 'not_found' });
    return res.json({ valid: claim.claimStatus === 'pending', status: claim.claimStatus });
  } catch (err) {
    console.error('[verifyClaim] error:', err.message);
    return res.status(500).json({ message: 'Verification error' });
  }
}

module.exports = { createClaim, getUserClaims, getClaimById, verifyClaim };

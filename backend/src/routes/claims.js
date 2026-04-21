'use strict';

const express = require('express');
const { body } = require('express-validator');
const {
  createClaim,
  getUserClaims,
  getClaimById,
  verifyClaim,
} = require('../controllers/claimsController');

const router = express.Router();

// ── Validators ────────────────────────────────────────────────────────────────

const createClaimValidators = [
  body('claimId')
    .matches(/^0x[0-9a-fA-F]{64}$/)
    .withMessage('claimId must be a 32-byte hex string'),
  body('amountRaw')
    .isInt({ min: 10000 })
    .withMessage('amountRaw must be >= 10000 (0.01 USDC in 6 decimals)'),
  body('creatorAddress')
    .matches(/^0x[0-9a-fA-F]{40}$/)
    .withMessage('Invalid Ethereum address'),
  body('expiresAt')
    .isISO8601()
    .withMessage('expiresAt must be a valid ISO date'),
  body('txHash')
    .matches(/^0x[0-9a-fA-F]{64}$/)
    .withMessage('txHash must be a valid transaction hash'),
];

// ── Routes ────────────────────────────────────────────────────────────────────

// IMPORTANT: /verify and /user/:address BEFORE /:claimId to avoid param collision
router.post('/verify', verifyClaim);
router.get('/user/:address', getUserClaims);
router.post('/', createClaimValidators, createClaim);
router.get('/:claimId', getClaimById);

module.exports = router;

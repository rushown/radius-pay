'use strict';

const Database = require('better-sqlite3');
const path     = require('path');
const fs       = require('fs');
const crypto   = require('crypto');

const DB_PATH = process.env.DB_PATH ?? './data/radiuspay.db';

// Ensure data directory exists
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH, { verbose: null });

// ── Schema ────────────────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS claims (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    claim_id        TEXT    NOT NULL UNIQUE,
    amount_raw      TEXT    NOT NULL,
    creator_address TEXT    NOT NULL,
    created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
    expires_at      TEXT    NOT NULL,
    claimed_at      TEXT,
    claimed_by      TEXT,
    claim_status    TEXT    NOT NULL DEFAULT 'pending',
    tx_hash         TEXT    NOT NULL,
    updated_at      TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_claims_creator  ON claims (creator_address);
  CREATE INDEX IF NOT EXISTS idx_claims_claimer  ON claims (claimed_by);
  CREATE INDEX IF NOT EXISTS idx_claims_status   ON claims (claim_status);
`);

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Format raw 6-decimal USDC bigint string as "X.XX" */
function formatUsdc(raw) {
  const n = BigInt(raw);
  const whole = n / 1_000_000n;
  const frac  = (n % 1_000_000n).toString().padStart(6, '0').slice(0, 2);
  return `${whole}.${frac}`;
}

/** Map DB row → API response shape (never expose secrets) */
function toResponse(row) {
  if (!row) return null;
  return {
    claimId:        row.claim_id,
    amount:         formatUsdc(row.amount_raw),
    amountRaw:      row.amount_raw,
    creatorAddress: row.creator_address,
    createdAt:      row.created_at,
    expiresAt:      row.expires_at,
    claimedAt:      row.claimed_at  ?? undefined,
    claimedBy:      row.claimed_by  ?? undefined,
    claimStatus:    row.claim_status,
    txHash:         row.tx_hash,
  };
}

// ── CRUD ──────────────────────────────────────────────────────────────────────

const Claim = {
  create({ claimId, amountRaw, creatorAddress, expiresAt, txHash }) {
    const stmt = db.prepare(`
      INSERT INTO claims (claim_id, amount_raw, creator_address, expires_at, tx_hash)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(claimId, amountRaw, creatorAddress.toLowerCase(), expiresAt, txHash);
    return this.findById(claimId);
  },

  findById(claimId) {
    const row = db.prepare('SELECT * FROM claims WHERE claim_id = ?').get(claimId);
    // Auto-expire stale records
    if (row && row.claim_status === 'pending') {
      const now = new Date();
      if (new Date(row.expires_at) < now) {
        db.prepare(`UPDATE claims SET claim_status = 'expired', updated_at = datetime('now') WHERE claim_id = ?`)
          .run(claimId);
        row.claim_status = 'expired';
      }
    }
    return toResponse(row);
  },

  findByUser(address) {
    const addr = address.toLowerCase();
    const rows = db.prepare(`
      SELECT * FROM claims
      WHERE LOWER(creator_address) = ? OR LOWER(claimed_by) = ?
      ORDER BY created_at DESC
      LIMIT 200
    `).all(addr, addr);
    return rows.map(toResponse);
  },

  markClaimed(claimId, claimedBy) {
    db.prepare(`
      UPDATE claims
      SET claim_status = 'claimed', claimed_by = ?, claimed_at = datetime('now'), updated_at = datetime('now')
      WHERE claim_id = ?
    `).run(claimedBy.toLowerCase(), claimId);
  },

  markReclaimed(claimId) {
    db.prepare(`
      UPDATE claims
      SET claim_status = 'reclaimed', updated_at = datetime('now')
      WHERE claim_id = ?
    `).run(claimId);
  },

  exists(claimId) {
    return !!db.prepare('SELECT 1 FROM claims WHERE claim_id = ?').get(claimId);
  },
};

module.exports = { Claim };

'use strict';

process.env.NODE_ENV = 'test';
process.env.DB_PATH  = ':memory:';  // in-memory DB for tests

const request = require('supertest');
const app     = require('../src/app');

const VALID_CLAIM_ID = '0x' + 'a'.repeat(64);
const VALID_TX_HASH  = '0x' + 'b'.repeat(64);
const VALID_ADDRESS  = '0x' + 'c'.repeat(40);

describe('POST /api/claims', () => {
  it('creates a claim with valid payload', async () => {
    const res = await request(app).post('/api/claims').send({
      claimId:        VALID_CLAIM_ID,
      amountRaw:      '1000000',
      creatorAddress: VALID_ADDRESS,
      expiresAt:      new Date(Date.now() + 86400000).toISOString(),
      txHash:         VALID_TX_HASH,
    });
    expect(res.status).toBe(201);
    expect(res.body.claimId).toBe(VALID_CLAIM_ID);
    expect(res.body.claimStatus).toBe('pending');
  });

  it('rejects duplicate claimId', async () => {
    const payload = {
      claimId:        '0x' + 'd'.repeat(64),
      amountRaw:      '1000000',
      creatorAddress: VALID_ADDRESS,
      expiresAt:      new Date(Date.now() + 86400000).toISOString(),
      txHash:         VALID_TX_HASH,
    };
    await request(app).post('/api/claims').send(payload);
    const res = await request(app).post('/api/claims').send(payload);
    expect(res.status).toBe(409);
  });

  it('rejects invalid claimId', async () => {
    const res = await request(app).post('/api/claims').send({
      claimId:        'notahex',
      amountRaw:      '1000000',
      creatorAddress: VALID_ADDRESS,
      expiresAt:      new Date(Date.now() + 86400000).toISOString(),
      txHash:         VALID_TX_HASH,
    });
    expect(res.status).toBe(400);
  });

  it('rejects amount below minimum', async () => {
    const res = await request(app).post('/api/claims').send({
      claimId:        '0x' + 'e'.repeat(64),
      amountRaw:      '100',
      creatorAddress: VALID_ADDRESS,
      expiresAt:      new Date(Date.now() + 86400000).toISOString(),
      txHash:         VALID_TX_HASH,
    });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/claims/:claimId', () => {
  it('returns 404 for unknown claimId', async () => {
    const res = await request(app).get(`/api/claims/${'0x' + 'f'.repeat(64)}`);
    expect(res.status).toBe(404);
  });
});

describe('POST /api/claims/verify', () => {
  it('returns valid:false for unknown claimId', async () => {
    const res = await request(app).post('/api/claims/verify')
      .send({ claimId: '0x' + '1'.repeat(64) });
    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(false);
    expect(res.body.status).toBe('not_found');
  });
});

describe('GET /health', () => {
  it('returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

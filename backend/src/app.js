'use strict';

require('dotenv').config();

const express    = require('express');
const helmet     = require('helmet');
const cors       = require('cors');
const rateLimit  = require('express-rate-limit');
const claimsRouter = require('./routes/claims');

const app  = express();
const PORT = process.env.PORT ?? 3001;

// ── Security Headers ──────────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc:  ["'self'"],
      objectSrc:  ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginOpenerPolicy: { policy: 'same-origin' },
}));

// ── CORS ──────────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? 'http://localhost:5173')
  .split(',')
  .map(o => o.trim());

app.use(cors({
  origin(origin, cb) {
    // Allow requests with no origin (curl, server-to-server)
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS policy: origin ${origin} not allowed`));
  },
  methods:     ['GET', 'POST', 'OPTIONS'],
  credentials: false,
}));

// ── Body Parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: false, limit: '16kb' }));

// ── Rate Limiting ─────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? '900000', 10), // 15 min
  max:      parseInt(process.env.RATE_LIMIT_MAX ?? '100', 10),
  standardHeaders: true,
  legacyHeaders:   false,
  message: { message: 'Too many requests, please try again later.' },
});

// Stricter limiter for write operations
const writeLimiter = rateLimit({
  windowMs: 60_000, // 1 min
  max:      10,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { message: 'Too many write operations, slow down.' },
});

app.use('/api', limiter);
app.use('/api/claims', writeLimiter);

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/claims', claimsRouter);

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ message: 'Not found' }));

// ── Global Error Handler ──────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  const status = err.status ?? 500;
  // Never leak error internals in production
  const message = process.env.NODE_ENV === 'production'
    ? 'Internal server error'
    : (err.message ?? 'Internal server error');
  console.error('[error]', err.message);
  res.status(status).json({ message });
});

// ── Start ─────────────────────────────────────────────────────────────────────
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`RadiusPay API listening on port ${PORT} [${process.env.NODE_ENV ?? 'development'}]`);
  });
}

module.exports = app;

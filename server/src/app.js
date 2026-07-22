const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth.routes');
const jobsRoutes = require('./routes/jobs.routes');
const billingRoutes = require('./routes/billing.routes');
const adminRoutes = require('./routes/admin.routes');

const app = express();
app.set('trust proxy', 1); // real client IP behind a reverse proxy (for geoip region default)

// ── Request logger ────────────────────────────────────────────────────────────
const COLORS = { GET: '\x1b[32m', POST: '\x1b[34m', PUT: '\x1b[33m', DELETE: '\x1b[31m', PATCH: '\x1b[35m' };
const RESET = '\x1b[0m';
const DIM   = '\x1b[2m';

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const ms     = Date.now() - start;
    const color  = COLORS[req.method] ?? '\x1b[37m';
    const status = res.statusCode;
    const scode  = status >= 500 ? '\x1b[31m' : status >= 400 ? '\x1b[33m' : status >= 300 ? '\x1b[36m' : '\x1b[32m';
    const ts     = new Date().toISOString().slice(11, 23);
    console.log(`${DIM}${ts}${RESET} ${color}${req.method.padEnd(6)}${RESET} ${scode}${status}${RESET} ${req.originalUrl} ${DIM}${ms}ms${RESET}`);
  });
  next();
});

// ── CORS ─────────────────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  ...(process.env.CLIENT_URL || 'http://localhost:3000').split(','),
  ...(process.env.ADMIN_URL  || 'http://localhost:3001').split(','),
].map((o) => o.trim()).filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));

// ── Rate limiting ─────────────────────────────────────────────────────────────
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, max: 30 }));

// ── Body parsing Razorpay webhook needs raw body for HMAC-SHA256 verification ─
app.use('/api/billing/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',    authRoutes);
app.use('/api/jobs',    jobsRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/admin',   adminRoutes);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'uniflux-job-portal' }));

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ message: 'Route not found' }));

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message || 'Internal server error' });
});

module.exports = app;

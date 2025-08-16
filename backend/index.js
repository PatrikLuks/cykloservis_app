
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const crypto = require('crypto');
// Logger early so it is available in all middleware (some early middlewares referenced it inside try/catch)
const logger = require('./utils/logger');


const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minut
  max: 100, // max 100 požadavků za 15 minut na IP
  standardHeaders: true,
  legacyHeaders: false,
});

const sensitiveLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // max 20 požadavků na citlivé endpointy
  message: 'Příliš mnoho požadavků, zkuste to později.'
});

const app = express();

// Lightweight request timing / outcome logger to help diagnose "backend někdy přestane vracet data"
app.use((req, res, next) => {
  const start = Date.now();
  const id = Math.random().toString(36).slice(2, 8);
  res.setHeader('X-Req-Id', id);
  res.on('finish', () => {
    logger.info('REQ', { id, m: req.method, u: req.originalUrl, s: res.statusCode, ms: Date.now() - start });
  });
  next();
});
// Zvýšení limitu velikosti JSON payloadu (kvůli Base64 obrázkům) – lze konfigurovat proměnnou MAX_JSON_BODY (např. '2mb')
const jsonLimit = process.env.MAX_JSON_BODY || '2mb';
app.use(express.json({ limit: jsonLimit }));
// Security headers – per-request CSP nonce + strict CSP (no unsafe-inline)
app.use((req, res, next) => {
  req.cspNonce = crypto.randomBytes(16).toString('base64');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  next();
});
const buildCsp = (nonce) => {
  const isDev = process.env.NODE_ENV !== 'production';
  const devOrigins = isDev ? ['http://localhost:3000', 'http://127.0.0.1:3000'] : [];
  return {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", `'nonce-${nonce}'`],
    styleSrc: ["'self'", `'nonce-${nonce}'`],
    imgSrc: ["'self'", 'data:', 'blob:'],
    fontSrc: ["'self'", 'data:'],
    connectSrc: ["'self'", ...devOrigins],
    objectSrc: ["'none'"],
    frameAncestors: ["'none'"],
    baseUri: ["'self'"],
    formAction: ["'self'"],
    upgradeInsecureRequests: []
  };
};
app.use((req, res, next) => helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: { directives: buildCsp(req.cspNonce) }
})(req, res, next));
// HSTS only if behind HTTPS (opt-in via ENV ENABLE_HSTS)
if (process.env.ENABLE_HSTS === 'true') {
  app.use(helmet.hsts({ maxAge: 31536000, includeSubDomains: true, preload: true }));
}

// Basic body pollution guard: reject prototype/constructor keys and log attempts
app.use((req, res, next) => {
  function check(obj) {
    if (!obj || typeof obj !== 'object') return false;
    return Object.keys(obj).some(k => k === '__proto__' || k === 'constructor' || k === 'prototype');
  }
  if (check(req.body) || check(req.query)) {
    try {
      logger.warn('POLLUTION_BLOCK', { ip: req.ip, url: req.originalUrl, keys: Object.keys(req.body||{}), q: Object.keys(req.query||{}) });
      require('./utils/auditLog')('security_pollution_block', req.ip, { url: req.originalUrl });
    } catch(_) {}
    return res.status(400).json({ error: 'Invalid keys' });
  }
  next();
});

// Input sanitization (enhanced) – trim + xss
const xss = require('xss');
const xssOptions = { whiteList: {}, stripIgnoreTag: true, stripIgnoreTagBody: ['script'] };
app.use((req, _res, next) => {
  const sanitizeString = v => {
    if (typeof v !== 'string') return v;
    return xss(v.trim(), xssOptions);
  };
  const walk = (o, depth=0) => {
    if (!o || typeof o !== 'object' || depth > 4) return;
    for (const k of Object.keys(o)) {
      const val = o[k];
      if (val && typeof val === 'object') walk(val, depth+1); else o[k] = sanitizeString(val);
    }
  };
  walk(req.body);
  walk(req.query);
  next();
});

// (Nonce already generated above for CSP)
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(limiter);

// Rate limit na citlivé endpointy
app.use('/auth/login', sensitiveLimiter);
app.use('/auth/register', sensitiveLimiter);
app.use('/auth/forgot-password', sensitiveLimiter);
app.use('/auth/save-password', sensitiveLimiter);
app.use('/auth/reset-password', sensitiveLimiter);

// Auth routes
app.use('/auth', require('./routes/auth'));
// Admin routes
app.use('/admin', require('./routes/admin'));
// Bikes routes
app.use('/bikes', require('./routes/bikes'));
// Mechanics routes
app.use('/mechanics', require('./routes/mechanics'));
// Service requests routes
app.use('/service-requests', require('./routes/serviceRequests'));
// Activity (recent actions) routes
app.use('/activity', require('./routes/activity'));

// Statické servírování uploadů (jen obrázky kol)
app.use('/uploads/bikes', express.static(path.join(process.cwd(), 'uploads', 'bikes'), {
  etag: true,
  lastModified: true,
  maxAge: '7d',
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
  }
}));
// Mechanic avatars
app.use('/uploads/mechanics', express.static(path.join(process.cwd(), 'uploads', 'mechanics'), {
  etag: true,
  lastModified: true,
  maxAge: '7d',
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
  }
}));
// User avatars
app.use('/uploads/users', express.static(path.join(process.cwd(), 'uploads', 'users'), {
  etag: true,
  lastModified: true,
  maxAge: '7d',
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
  }
}));

const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/cykloservis';
mongoose.connect(mongoUri)
  .then(() => logger.info('MongoDB connected'))
  .catch(err => logger.error('MongoDB connect fail', { error: err.message }));

app.get('/', (req, res) => {
  res.send('Bikeapp backend running');
});
// Generický fallback pro ostatní složky v uploads (ponecháno, ale specifické složky mají vlastní cache header nastavení výše)
const uploadsDir = process.env.BIKES_UPLOAD_DIR || path.join(process.cwd(), 'uploads');
app.use('/uploads', express.static(uploadsDir));
// Health endpoint pro monitoring a readiness
app.get('/api/health/health', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime(), ts: Date.now() });
});

// Global error handler (must be after routes)
// Ensures we always respond (otherwise some errors could leave the request hanging)
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  try {
    logger.error('UNCAUGHT_ROUTE_ERROR', { path: req.originalUrl, msg: err.message, stack: (err.stack || '').split('\n').slice(0,4).join(' | ') });
  } catch (_) { /* ignore */ }
  if (res.headersSent) return next(err);
  res.status(500).json({ error: 'Server error' });
});

// Global error handler (after all routes / middleware)
// eslint-disable-next-line no-unused-vars

const PORT = process.env.PORT || 5001;
const server = app.listen(PORT, () => logger.info(`Server running on port ${PORT}`));

// Mongoose connection observability
mongoose.connection.on('error', err => {
  console.error('MONGOOSE_CONNECTION_ERROR', err.message);
});
mongoose.connection.on('disconnected', () => {
  console.warn('MONGOOSE_DISCONNECTED');
});
mongoose.connection.on('reconnected', () => { logger.info('MONGOOSE_RECONNECTED'); });

// Graceful shutdown helpers
let shuttingDown = false;
async function gracefulShutdown(signal) {
  if (shuttingDown) return; // prevent double execution
  shuttingDown = true;
  logger.warn(`Received ${signal}, shutting down gracefully...`);
  setTimeout(() => process.exit(0), 10_000).unref(); // hard timeout
  try { await mongoose.connection.close(); } catch (e) { /* ignore */ }
  server.close(() => {
  logger.info('HTTP server closed. Bye.');
    process.exit(0);
  });
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('unhandledRejection', (reason, promise) => {
  console.error('UNHANDLED_REJECTION', { reason });
});
process.on('uncaughtException', err => {
  console.error('UNCAUGHT_EXCEPTION', err);
  // Decide whether to exit (safer to restart in production)
});

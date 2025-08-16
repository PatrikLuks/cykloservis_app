/**
 * Copyright (c) 2025 Patrik Luks, Adam Kroupa
 * All rights reserved. Proprietary and confidential.
 * Use, distribution or modification without explicit permission of BOTH authors is strictly prohibited.
 */
require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

// Rate limitery a metrics vytváří interní intervaly/timeouts => v testu je vypneme,
// aby Jest neměl open handles (coverage běhy by jinak visely)
let limiter;
let sensitiveLimiter;
let rateLimit;
const isTestEnv = !!process.env.JEST_WORKER_ID;
const enableRateLimit =
  (!isTestEnv && process.env.PLAYWRIGHT_E2E !== '1') || process.env.FORCE_RATE_LIMIT === '1';
if (enableRateLimit) {
  const { rateLimit: rlCfg } = require('./config');
  rateLimit = require('express-rate-limit');
  const { rateLimitRejectedTotal } = require('./metrics');
  const onLimitReached = () => {
    try {
      rateLimitRejectedTotal.inc();
    } catch (_) {
      /* silent */
    }
  };
  limiter = rateLimit({
    windowMs: rlCfg.windowMs,
    max: rlCfg.max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
      onLimitReached();
      res.status(429).json({ error: 'Rate limit exceeded', code: 'RATE_LIMIT' });
    },
  });
  sensitiveLimiter = rateLimit({
    windowMs: rlCfg.windowMs,
    max: rlCfg.sensitiveMax,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
      onLimitReached();
      res.status(429).json({ error: 'Rate limit exceeded', code: 'RATE_LIMIT' });
    },
  });
}

const { logger, requestLogger } = require('./middleware/logger');
// Metrics: v test režimu jsou povolené, ale collectDefaultMetrics se vevnitř neaktivuje
const { metricsMiddleware, metricsHandler } = require('./metrics');
const { setupDocs } = require('./docs');
// Fallback tajemství pro JWT v test prostředí (aby přihlášení nepadalo na chybě secretu)
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'test-secret';
}
const app = express();
app.set('trust proxy', 1); // pro rate limit za proxy
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'self'"],
      },
    },
  })
);
app.use(requestLogger);
app.use(metricsMiddleware);
// Zvýšení limitu velikosti JSON payloadu (kvůli Base64 obrázkům) – lze konfigurovat proměnnou MAX_JSON_BODY (např. '2mb')
const jsonLimit = process.env.MAX_JSON_BODY || '2mb';
app.use(express.json({ limit: jsonLimit }));
app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
if (limiter) {
  app.use(limiter);
  // Rate limit na citlivé endpointy
  app.use('/auth/login', sensitiveLimiter);
  app.use('/auth/register', sensitiveLimiter);
  app.use('/auth/forgot-password', sensitiveLimiter);
  app.use('/auth/save-password', sensitiveLimiter);
  app.use('/auth/reset-password', sensitiveLimiter);
}

// Auth routes
app.use('/auth', require('./routes/auth'));
// Admin routes
app.use('/admin', require('./routes/admin'));
// Bikes routes
app.use('/bikes', require('./routes/bikes'));
// Service requests routes
app.use('/service-requests', require('./routes/serviceRequests'));
// Test utils (povoleno pouze pokud je nastavena proměnná ENABLE_TEST_UTILS=1)
if (process.env.ENABLE_TEST_UTILS === '1') {
  app.use('/test-utils', require('./routes/testUtils'));
}

// Statické servírování uploadů (jen obrázky kol)
app.use(
  '/uploads/bikes',
  express.static(path.join(process.cwd(), 'uploads', 'bikes'), {
    etag: true,
    lastModified: true,
    maxAge: '7d',
    setHeaders: (res) => {
      res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
    },
  })
);

function connectMongo(connectImpl = mongoose.connect) {
  return connectImpl(process.env.MONGO_URI)
    .then(() => logger.info('MongoDB connected'))
    .catch((err) => logger.error({ err }, 'MongoDB connection error'));
}

if (!process.env.SKIP_DB && !process.env.JEST_WORKER_ID) {
  connectMongo();
} else {
  logger.warn('SKIP_DB=1 nebo testovací prostředí => přeskočeno připojení k MongoDB');
}

app.get('/', (req, res) => {
  res.send('Bikeapp backend running');
});
// Statické soubory uploadů (obrázky kol)
const uploadsDir = process.env.BIKES_UPLOAD_DIR || path.join(process.cwd(), 'uploads');
app.use('/uploads', express.static(uploadsDir));
// Health endpoint pro monitoring a readiness
app.get('/api/health/health', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

app.get('/api/health/ready', async (req, res) => {
  const dbState = mongoose.connection.readyState; // 0=disconnected 1=connected 2=connecting 3=disconnecting
  const ready = !process.env.SKIP_DB ? dbState === 1 : true;
  res.status(ready ? 200 : 503).json({ status: ready ? 'ready' : 'not-ready', dbState });
});

setupDocs(app);

app.get('/api/metrics', metricsHandler);

// Centrálni error handler (musí být až po routách)
const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);

let server;
if (!process.env.JEST_WORKER_ID) {
  // don't auto-listen under Jest so supertest gets the bare app
  const { port } = require('./config');
  server = app.listen(port, () => logger.info({ port }, 'Server listening'));
}

// Explicit start pro testy aby šla pokrýt větev se server.close v shutdown
function _startTestServer() {
  if (server) return server; // already started
  server = app.listen(0); // random free port
  return server;
}

// Graceful shutdown
function shutdown(signal) {
  logger.warn({ signal }, 'shutdown:start');
  const isJest = !!process.env.JEST_WORKER_ID;
  const exitOk = () => {
    if (!isJest) process.exit(0);
  };
  const exitFail = () => {
    if (!isJest) process.exit(1);
  };
  const closeMongo = async (context) => {
    try {
      if (mongoose.connection && mongoose.connection.readyState !== 0) {
        await mongoose.connection.close();
        logger.info(`Mongo connection closed${context ? ' (' + context + ')' : ''}`);
      }
    } catch (err) {
      logger.error({ err }, 'Error closing Mongo connection');
    }
    exitOk();
  };
  if (server) {
    try {
      server.close(() => {
        logger.info('HTTP server closed');
        closeMongo();
      });
    } catch (err) {
      logger.error({ err }, 'Error closing HTTP server');
      closeMongo('after server close error');
    }
  } else {
    closeMongo('no server');
  }
  // Force exit if not closed within timeout
  if (!isJest) {
    setTimeout(() => {
      logger.error('Force exit after timeout');
      exitFail();
    }, 8000).unref();
  }
}
if (!process.env.JEST_WORKER_ID) {
  ['SIGINT', 'SIGTERM'].forEach((sig) => process.on(sig, () => shutdown(sig)));
}

module.exports = app;
// Pro test teardown: exportujeme rate limitery ke korektnímu ukončení intervalů
module.exports._rateLimiters = limiter ? [limiter, sensitiveLimiter] : [];
module.exports._shutdown = shutdown;
module.exports._startTestServer = _startTestServer;
module.exports.connectMongo = connectMongo;

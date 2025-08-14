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
const isTest = !!process.env.JEST_WORKER_ID;
if (!isTest) {
  rateLimit = require('express-rate-limit');
  limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minut
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
  });
  sensitiveLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: 'Příliš mnoho požadavků, zkuste to později.',
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

if (!process.env.SKIP_DB && !process.env.JEST_WORKER_ID) {
  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => logger.info('MongoDB connected'))
    .catch((err) => logger.error({ err }, 'MongoDB connection error'));
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
  const PORT = process.env.PORT || 5001;
  server = app.listen(PORT, () => logger.info({ port: PORT }, 'Server listening'));
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


require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');


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
// Zvýšení limitu velikosti JSON payloadu (kvůli Base64 obrázkům) – lze konfigurovat proměnnou MAX_JSON_BODY (např. '2mb')
const jsonLimit = process.env.MAX_JSON_BODY || '2mb';
app.use(express.json({ limit: jsonLimit }));
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
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

app.get('/', (req, res) => {
  res.send('Bikeapp backend running');
});
// Generický fallback pro ostatní složky v uploads (ponecháno, ale specifické složky mají vlastní cache header nastavení výše)
const uploadsDir = process.env.BIKES_UPLOAD_DIR || path.join(process.cwd(), 'uploads');
app.use('/uploads', express.static(uploadsDir));
// Health endpoint pro monitoring a readiness
app.get('/api/health/health', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

// Global error handler (after all routes / middleware)
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  try {
    const status = err.status || 500;
    const payload = {
      error: status === 500 ? 'Server error' : (err.message || 'Error'),
    };
    // Basic logging (avoid crashing if circular)
    console.error('REQ_ERROR', {
      method: req.method,
      url: req.originalUrl,
      msg: err.message,
      stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
    });
    if (!res.headersSent) {
      res.status(status).json(payload);
    }
  } catch (inner) {
    if (!res.headersSent) res.status(500).json({ error: 'Server error' });
  }
});

const PORT = process.env.PORT || 5001;
const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Mongoose connection observability
mongoose.connection.on('error', err => {
  console.error('MONGOOSE_CONNECTION_ERROR', err.message);
});
mongoose.connection.on('disconnected', () => {
  console.warn('MONGOOSE_DISCONNECTED');
});
mongoose.connection.on('reconnected', () => {
  console.log('MONGOOSE_RE reconnected');
});

// Graceful shutdown helpers
let shuttingDown = false;
async function gracefulShutdown(signal) {
  if (shuttingDown) return; // prevent double execution
  shuttingDown = true;
  console.log(`Received ${signal}, shutting down gracefully...`);
  setTimeout(() => process.exit(0), 10_000).unref(); // hard timeout
  try { await mongoose.connection.close(); } catch (e) { /* ignore */ }
  server.close(() => {
    console.log('HTTP server closed. Bye.');
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

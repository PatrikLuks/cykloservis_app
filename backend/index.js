
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
// Service requests routes
app.use('/service-requests', require('./routes/serviceRequests'));

// Statické servírování uploadů (jen obrázky kol)
const path = require('path');
app.use('/uploads/bikes', express.static(path.join(process.cwd(), 'uploads', 'bikes'), {
  etag: true,
  lastModified: true,
  maxAge: '7d',
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
  }
}));

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

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

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

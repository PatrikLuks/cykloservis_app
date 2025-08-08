
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');


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
app.use(express.json());
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

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

app.get('/', (req, res) => {
  res.send('Bikeapp backend running');
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

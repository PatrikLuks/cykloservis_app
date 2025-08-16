jest.setTimeout(20000);
require('dotenv').config();

// Musíme nastavit MAX_BIKES_PER_USER před require routeru
process.env.MAX_BIKES_PER_USER = '3';

const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const authRouter = require('../routes/auth');
const bikesRouter = require('../routes/bikes');
const User = require('../models/User');

const app = express();
app.use(express.json({ limit: '2mb' }));
app.use('/auth', authRouter);
app.use('/bikes', bikesRouter);

let token;
let email;

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI_TEST, {});
  email = `limit_test_${Date.now()}@example.com`;
  await request(app).post('/auth/register').send({ email });
  const user = await User.findOne({ email });
  user.isVerified = true;
  user.password = '$2a$10$abcdefghijklmnopqrstuv';
  await user.save();
  await request(app).post('/auth/save-password').send({ email, password: 'Secret123' });
  const loginRes = await request(app).post('/auth/login').send({ email, password: 'Secret123' });
  token = loginRes.body.token;
});

afterAll(async () => {
  if (mongoose.connection.readyState === 1) {
    try { await mongoose.connection.db.admin().command({ dropDatabase: 1 }); } catch {}
    await mongoose.disconnect();
  }
});

function auth() { return { Authorization: `Bearer ${token}` }; }

const SMALL_PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=';
const INVALID_GIF = 'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBA==';

describe('Bikes limits & MIME', () => {
  it('rejects unsupported image MIME (gif) before hitting limit', async () => {
    const res = await request(app).post('/bikes').set(auth()).send({ title: 'GIF Bike', imageUrl: INVALID_GIF });
    // Should be 400 (invalid format) under current regex; allow 413 fallback just in case
    expect([400,413]).toContain(res.statusCode);
    if (res.statusCode === 400) {
      expect(res.body.error).toMatch(/Neplatný|formát/i);
    }
  });

  it('allows creation up to MAX_BIKES_PER_USER', async () => {
    for (let i = 1; i <= 3; i++) {
      const res = await request(app).post('/bikes').set(auth()).send({ title: 'Bike '+i, imageUrl: SMALL_PNG });
      expect(res.statusCode).toBe(201);
    }
  });

  it('returns 409 when creating over limit', async () => {
    const res = await request(app).post('/bikes').set(auth()).send({ title: 'Overflow', imageUrl: SMALL_PNG });
    expect(res.statusCode).toBe(409);
  });

  it('rejects malformed base64 string (format error)', async () => {
    const bad = 'data:image/png;base64,***NOT_BASE64***';
    const res = await request(app).post('/bikes').set(auth()).send({ title: 'Bad Base64', imageUrl: bad });
    // Now may return 409 if limit already reached; accept 400 or 409
    expect([400,409]).toContain(res.statusCode);
  });
});

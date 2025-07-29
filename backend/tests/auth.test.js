jest.setTimeout(20000);
require('dotenv').config();
const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const authRoutes = require('../routes/auth');

const app = express();
app.use(express.json());
app.use('/auth', authRoutes);

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI_TEST, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

afterAll(async () => {
  if (mongoose.connection.readyState === 1) {
    try {
      await mongoose.connection.db.admin().command({ dropDatabase: 1 });
    } catch (e) {}
    await mongoose.disconnect();
  }
});

describe('Auth API', () => {
  it('should not register with invalid email', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'invalid', password: 'Test123!' });
    expect(res.statusCode).toBe(400);
  });

  it('should register with valid email', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'test@example.com', password: 'Test123!' });
    expect(res.statusCode).toBe(201);
  });

  it('should save password for existing user', async () => {
    // Použít unikátní email pro každý běh testu
    const uniqueEmail = `save_${Date.now()}@example.com`;
    // Nejprve zaregistrovat uživatele
    const regRes = await request(app)
      .post('/auth/register')
      .send({ email: uniqueEmail, password: 'Test123!' });
    expect(regRes.statusCode).toBe(201);
    // Ověřit, že uživatel existuje
    const user = await User.findOne({ email: uniqueEmail });
    expect(user).not.toBeNull();
    // Poté testovat uložení hesla
    const res = await request(app)
      .post('/auth/save-password')
      .send({ email: uniqueEmail, password: 'Test123!' });
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/Heslo bylo uloženo\./i);
  });
});

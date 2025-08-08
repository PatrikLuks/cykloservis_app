jest.setTimeout(30000);
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
  await mongoose.connect(process.env.MONGO_URI_TEST);
});

afterAll(async () => {
  if (mongoose.connection.readyState === 1) {
    try { await mongoose.connection.db.admin().command({ dropDatabase: 1 }); } catch (e) {}
    await mongoose.disconnect();
  }
});

describe('E2E Registration Flow', () => {
  it('should register, verify code, complete profile, and allow login', async () => {
    const email = `e2e_${Date.now()}@example.com`;

    // 1) request code
    const regRes = await request(app).post('/auth/register').send({ email });
    expect(regRes.statusCode).toBe(201);

    // 2) fetch code from DB
    const userAfterReg = await User.findOne({ email });
    expect(userAfterReg).toBeTruthy();
    expect(userAfterReg.verificationCode).toMatch(/^[0-9]{6}$/);

    // 3) save password
    const savePass = await request(app).post('/auth/save-password').send({ email, password: 'Test123!' });
    expect(savePass.statusCode).toBe(200);

    // 4) verify code
    const verify = await request(app).post('/auth/verify-code').send({ email, code: userAfterReg.verificationCode });
    expect(verify.statusCode).toBe(200);

    // 5) complete profile
    const complete = await request(app).post('/auth/complete-profile').send({
      email,
      firstName: 'E2E',
      lastName: 'User',
      birthDate: '1990-01-01',
      gender: 'male',
      location: 'Praha'
    });
    expect(complete.statusCode).toBe(200);

    // 6) login
    const login = await request(app).post('/auth/login').send({ email, password: 'Test123!' });
    expect(login.statusCode).toBe(200);
    expect(login.body).toHaveProperty('token');
    expect(login.body).toHaveProperty('finallyRegistered', true);
  });
});

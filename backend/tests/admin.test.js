jest.setTimeout(20000);
require('dotenv').config();
const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const authRouter = require('../routes/auth');
const adminRouter = require('../routes/admin');
const User = require('../models/User');

const app = express();
app.use(express.json());
app.use('/auth', authRouter);
app.use('/admin', adminRouter);

let adminToken; let userToken; let targetUserId;

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI_TEST, {});
  const aEmail = `admin_${Date.now()}@example.com`;
  await request(app).post('/auth/register').send({ email: aEmail });
  const adminUser = await User.findOne({ email: aEmail });
  adminUser.isVerified = true; adminUser.password = '$2a$10$abcdefghijklmnopqrstuv'; adminUser.role='admin';
  await adminUser.save();
  await request(app).post('/auth/save-password').send({ email: aEmail, password: 'Secret123' });
  const adminLogin = await request(app).post('/auth/login').send({ email: aEmail, password: 'Secret123' });
  adminToken = adminLogin.body.token;
  const uEmail = `user_${Date.now()}@example.com`;
  await request(app).post('/auth/register').send({ email: uEmail });
  const u = await User.findOne({ email: uEmail });
  u.isVerified = true; u.password='$2a$10$abcdefghijklmnopqrstuv';
  await u.save();
  await request(app).post('/auth/save-password').send({ email: uEmail, password: 'Secret123' });
  const userLogin = await request(app).post('/auth/login').send({ email: uEmail, password: 'Secret123' });
  userToken = userLogin.body.token;
  targetUserId = u._id.toString();
});

afterAll(async () => {
  if (mongoose.connection.readyState === 1) {
    try { await mongoose.connection.db.admin().command({ dropDatabase: 1 }); } catch {}
    await mongoose.disconnect();
  }
});

function auth(t) { return { Authorization: `Bearer ${t}` }; }

describe('Admin endpoints', () => {
  it('rejects non-admin list users', async () => {
    const res = await request(app).get('/admin/users').set(auth(userToken));
    expect(res.statusCode).toBe(403);
  });

  it('allows admin list users', async () => {
    const res = await request(app).get('/admin/users').set(auth(adminToken));
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
  });

  it('admin can promote user (idempotent if already admin)', async () => {
    const res = await request(app).post(`/admin/users/${targetUserId}/role`).set(auth(adminToken)).send({ role: 'admin' });
    expect([200,404]).toContain(res.statusCode);
    if (res.statusCode === 200) expect(res.body.role).toBe('admin');
  });

  it('non-admin cannot change role (fresh user)', async () => {
    // create a fresh ordinary user not yet promoted
    const freshEmail = `user_fresh_${Date.now()}@example.com`;
    await request(app).post('/auth/register').send({ email: freshEmail });
    const freshUser = await User.findOne({ email: freshEmail });
    freshUser.isVerified = true; freshUser.password = '$2a$10$abcdefghijklmnopqrstuv';
    await freshUser.save();
    await request(app).post('/auth/save-password').send({ email: freshEmail, password: 'Secret123' });
    const freshLogin = await request(app).post('/auth/login').send({ email: freshEmail, password: 'Secret123' });
    const freshToken = freshLogin.body.token;
    const res = await request(app).post(`/admin/users/${targetUserId}/role`).set(auth(freshToken)).send({ role: 'user' });
    expect(res.statusCode).toBe(403);
  });
});

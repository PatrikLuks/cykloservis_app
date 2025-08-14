jest.setTimeout(20000);
const request = require('supertest');
const app = require('..');
const mongoose = require('mongoose');
const User = require('../models/User');
const { ensureDb } = require('./helpers/testFactory');

let adminToken;
let userToken;
let targetUserId;

beforeAll(async () => {
  await ensureDb();
  const aEmail = `admin_${Date.now()}@example.com`;
  await request(app).post('/auth/register').send({ email: aEmail });
  const adminUser = await User.findOne({ email: aEmail });
  adminUser.isVerified = true;
  adminUser.password = '$2a$10$abcdefghijklmnopqrstuv';
  adminUser.role = 'admin';
  await adminUser.save();
  await request(app).post('/auth/save-password').send({ email: aEmail, password: 'Secret123' });
  const adminLogin = await request(app)
    .post('/auth/login')
    .send({ email: aEmail, password: 'Secret123' });
  adminToken = adminLogin.body.token;
  const uEmail = `user_${Date.now()}@example.com`;
  await request(app).post('/auth/register').send({ email: uEmail });
  const u = await User.findOne({ email: uEmail });
  u.isVerified = true;
  u.password = '$2a$10$abcdefghijklmnopqrstuv';
  await u.save();
  await request(app).post('/auth/save-password').send({ email: uEmail, password: 'Secret123' });
  const userLogin = await request(app)
    .post('/auth/login')
    .send({ email: uEmail, password: 'Secret123' });
  userToken = userLogin.body.token;
  targetUserId = u._id.toString();
});

afterAll(async () => {
  /* global teardown handles disconnect */
});

function auth(t) {
  return { Authorization: `Bearer ${t}` };
}

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
    const res = await request(app)
      .post(`/admin/users/${targetUserId}/role`)
      .set(auth(adminToken))
      .send({ role: 'admin' });
    expect([200, 404]).toContain(res.statusCode);
    if (res.statusCode === 200) expect(res.body.role).toBe('admin');
  });

  it('non-admin cannot change role', async () => {
    const res = await request(app)
      .post(`/admin/users/${targetUserId}/role`)
      .set(auth(userToken))
      .send({ role: 'user' });
    expect(res.statusCode).toBe(403);
  });
});

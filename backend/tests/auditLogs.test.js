jest.setTimeout(20000);
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const bikesRouter = require('../routes/bikes');
const authRouter = require('../routes/auth');
const User = require('../models/User');

const app = express();
app.use(express.json({ limit: '2mb' }));
app.use('/auth', authRouter);
app.use('/bikes', bikesRouter);

const auditPath = path.join(__dirname, '../audit.log');
let token;

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI_TEST, {});
  try { fs.writeFileSync(auditPath, ''); } catch {}
  const email = `audit_${Date.now()}@example.com`;
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

describe('Audit log writes', () => {
  it('writes entries for create/update/delete lifecycle', async () => {
    const startContent = fs.readFileSync(auditPath, 'utf8');
    const c = await request(app).post('/bikes').set(auth()).send({ title: 'Audit Bike' });
    expect(c.statusCode).toBe(201);
    const id = c.body._id;
    const u = await request(app).put(`/bikes/${id}`).set(auth()).send({ model: 'A1' });
    expect(u.statusCode).toBe(200);
    const d = await request(app).delete(`/bikes/${id}`).set(auth());
    expect(d.statusCode).toBe(200);
    const r = await request(app).post(`/bikes/${id}/restore`).set(auth());
    expect(r.statusCode).toBe(200);
    const endContent = fs.readFileSync(auditPath, 'utf8');
    const newLines = endContent.trim().split(/\n/).filter(l => !startContent.includes(l));
    expect(newLines.length).toBeGreaterThanOrEqual(4);
    const parsed = newLines.map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
    const actions = parsed.map(p => p.action);
    expect(actions).toEqual(expect.arrayContaining(['bike_create','bike_update','bike_soft_delete','bike_restore']));
  });
});

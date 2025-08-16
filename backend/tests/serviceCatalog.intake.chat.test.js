jest.setTimeout(20000);
require('dotenv').config();
const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const authRouter = require('../routes/auth');
const serviceRequestsRouter = require('../routes/serviceRequests');
const mechanicsRouter = require('../routes/mechanics');
const usersRouter = require('../routes/user');
const ServiceCatalogItem = require('../models/ServiceCatalogItem');
const User = require('../models/User');

const app = express();
app.use(express.json());
app.use('/auth', authRouter);
app.use('/service-requests', serviceRequestsRouter);
app.use('/mechanics', mechanicsRouter);
app.use('/user', usersRouter);

function makeEmail(prefix){ return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}@example.com`; }

let ownerToken; let mechToken; let requestId; let mechanicId; let catalogSeeded;

beforeAll(async ()=> {
  await mongoose.connect(process.env.MONGO_URI_TEST, {});
  // Seed minimal catalog (if not existing)
  const seed = [ ['CHK_BASIC','Základní kontrola',20,0], ['CHAIN_REPLACE','Výměna řetězu',20,240] ];
  for (const [code,name,baseMinutes,basePrice] of seed) {
    await ServiceCatalogItem.updateOne({ code }, { $set: { name, baseMinutes, basePrice, active: true } }, { upsert: true });
  }
  catalogSeeded = true;
  // Create owner
  const ownerEmail = makeEmail('owner');
  await request(app).post('/auth/register').send({ email: ownerEmail });
  const ownerUser = await User.findOne({ email: ownerEmail });
  ownerUser.isVerified = true; ownerUser.password = '$2a$10$abcdefghijklmnopqrstuv'; await ownerUser.save();
  await request(app).post('/auth/save-password').send({ email: ownerEmail, password: 'Secret123' });
  ownerToken = (await request(app).post('/auth/login').send({ email: ownerEmail, password: 'Secret123' })).body.token;
  // Create mechanic
  const mechEmail = makeEmail('mech');
  await request(app).post('/auth/register').send({ email: mechEmail });
  const mechUser = await User.findOne({ email: mechEmail });
  mechUser.isVerified = true; mechUser.password = '$2a$10$abcdefghijklmnopqrstuv'; mechUser.role='mechanic'; await mechUser.save();
  await request(app).post('/auth/save-password').send({ email: mechEmail, password: 'Secret123' });
  mechToken = (await request(app).post('/auth/login').send({ email: mechEmail, password: 'Secret123' })).body.token;
});

afterAll(async ()=> {
  if (mongoose.connection.readyState === 1) {
    try { await mongoose.connection.db.admin().command({ dropDatabase: 1 }); } catch {}
    await mongoose.disconnect();
  }
});

function auth(t){ return { Authorization: `Bearer ${t}` }; }

describe('Service Catalog & Intake & Chat', () => {
  test('catalog list returns seeded items', async () => {
    const res = await request(app).get('/service-requests/catalog').set(auth(ownerToken));
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.find(i=>i.code==='CHK_BASIC')).toBeTruthy();
  });
  test('owner creates service request (assign later)', async () => {
    const res = await request(app).post('/service-requests').set(auth(ownerToken)).send({ title: 'Řetěz vrže', deferredBike: true });
    expect(res.statusCode).toBe(201);
    requestId = res.body._id;
  });
  test('mechanic cannot intake without assignment (403 or 404)', async () => {
    const res = await request(app).put(`/service-requests/${requestId}/intake`).set(auth(mechToken)).send({ operations: [{ code: 'CHK_BASIC' }] });
    expect([403,404]).toContain(res.statusCode);
  });
});

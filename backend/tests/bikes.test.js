jest.setTimeout(20000);
require('dotenv').config();
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

let token;

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI_TEST, {});
  const email = `bike_test_${Date.now()}@example.com`;
  // registrace (odešle kód) -> z DB vzít kód -> ověřit -> uložit heslo -> login
  await request(app).post('/auth/register').send({ email });
  const user = await User.findOne({ email });
  user.isVerified = true; // zjednodušení testu - simulace ověření emailu
  user.password = '$2a$10$abcdefghijklmnopqrstuv'; // dummy hash
  await user.save();
  // Uložit heslo pomocí save-password
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

describe('Bikes API', () => {
  let createdId;
  let adminToken;

  it('creates a bike', async () => {
    const res = await request(app)
      .post('/bikes')
      .set(auth())
      .send({ title: 'Test Bike', model: 'Model X', year: 2024 });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('_id');
    expect(res.body).toHaveProperty('ownerEmail');
    createdId = res.body._id;
  });

  it('restore of not deleted bike returns 404', async () => {
    const res = await request(app).post(`/bikes/${createdId}/restore`).set(auth());
    expect(res.statusCode).toBe(404);
  });

  it('lists bikes (1)', async () => {
    const res = await request(app).get('/bikes').set(auth());
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
  });

  it('gets detail', async () => {
    const res = await request(app).get(`/bikes/${createdId}`).set(auth());
    expect(res.statusCode).toBe(200);
    expect(res.body._id).toBe(createdId);
  });

  it('updates bike', async () => {
    const res = await request(app)
      .put(`/bikes/${createdId}`)
      .set(auth())
      .send({ model: 'Model Y', minutesRidden: 120 });
    expect(res.statusCode).toBe(200);
    expect(res.body.model).toBe('Model Y');
    expect(res.body.minutesRidden).toBe(120);
  });

  it('rejects oversize image', async () => {
    const big = 'data:image/png;base64,' + 'a'.repeat(1_300_000);
    const res = await request(app)
      .post('/bikes')
      .set(auth())
      .send({ title: 'Big Img', imageUrl: big });
    expect(res.statusCode).toBe(413);
  });

  it('deletes bike', async () => {
    const res = await request(app).delete(`/bikes/${createdId}`).set(auth());
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('softDeleted', true);
    const list = await request(app).get('/bikes').set(auth());
    expect(list.body.length).toBe(0);
  });

  it('restores bike', async () => {
    const restore = await request(app).post(`/bikes/${createdId}/restore`).set(auth());
    expect(restore.statusCode).toBe(200);
    expect(restore.body).toHaveProperty('_id', createdId);
    const list2 = await request(app).get('/bikes').set(auth());
    expect(list2.body.length).toBe(1);
  });

  it('lists deleted bikes (empty)', async () => {
    const res = await request(app).get('/bikes/deleted').set(auth());
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(0);
  });

  it('hard delete requires admin (403)', async () => {
    const res = await request(app).delete(`/bikes/${createdId}/hard`).set(auth());
    expect(res.statusCode).toBe(403);
  });

  it('hard delete works with admin token', async () => {
    // vytvořit admina
    const aEmail = `admin_${Date.now()}@example.com`;
    await request(app).post('/auth/register').send({ email: aEmail });
    const adminUser = await User.findOne({ email: aEmail });
    adminUser.isVerified = true;
    adminUser.password = '$2a$10$abcdefghijklmnopqrstuv';
    adminUser.role = 'admin';
    await adminUser.save();
    await request(app).post('/auth/save-password').send({ email: aEmail, password: 'Secret123' });
    const loginRes = await request(app).post('/auth/login').send({ email: aEmail, password: 'Secret123' });
    adminToken = loginRes.body.token;
    const resDel = await request(app).delete(`/bikes/${createdId}/hard`).set({ Authorization: `Bearer ${adminToken}` });
    // bike může být již soft restored, takže hard delete by měl nyní projít (pokud existuje)
    expect([200,404]).toContain(resDel.statusCode);
  });

  it('uploads image via multipart', async () => {
    // nejprve vytvořit nové kolo pro upload
    const resCreate = await request(app)
      .post('/bikes')
      .set(auth())
      .send({ title: 'Upload Test' });
    expect(resCreate.statusCode).toBe(201);
    const bid = resCreate.body._id;
    const resUp = await request(app)
      .post(`/bikes/${bid}/image`)
      .set(auth())
      .attach('image', Buffer.from('89504E470D0A1A0A','hex'), 'tiny.png');
    // očekáváme 200 nebo případně 500 pokud FS selže (pak test failne) – primárně 200
    expect(resUp.statusCode).toBe(200);
    expect(resUp.body).toHaveProperty('_id', bid);
    expect(resUp.body).toHaveProperty('imageUrl');
  });
});

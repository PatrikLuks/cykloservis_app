jest.setTimeout(20000);
const fs = require('fs');
const path = require('path');
const request = require('supertest');
const app = require('..');
const User = require('../models/User');
const { ensureDb } = require('./helpers/testFactory');

const auditPath = path.join(__dirname, '../audit.log');
let token;

beforeAll(async () => {
  await ensureDb();
  try {
    fs.writeFileSync(auditPath, '');
  } catch (e) {
    /* ignore init */
  }
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
  /* global teardown handles disconnect */
});

function auth() {
  return { Authorization: `Bearer ${token}` };
}

describe('Audit log writes', () => {
  it('writes entries for create/update/delete lifecycle', async () => {
    const startContent = fs.readFileSync(auditPath, 'utf8');
    const c = await request(app).post('/bikes').set(auth()).send({ title: 'Audit Bike' });
    expect(c.statusCode).toBe(201);
    const id = c.body.id;
    const u = await request(app).put(`/bikes/${id}`).set(auth()).send({ model: 'A1' });
    expect(u.statusCode).toBe(200);
    const d = await request(app).delete(`/bikes/${id}`).set(auth());
    expect(d.statusCode).toBe(200);
    const r = await request(app).post(`/bikes/${id}/restore`).set(auth());
    expect(r.statusCode).toBe(200);
    const endContent = fs.readFileSync(auditPath, 'utf8');
    const newLines = endContent
      .trim()
      .split(/\n/)
      .filter((l) => !startContent.includes(l));
    const parsed = newLines
      .map((l) => {
        try {
          return JSON.parse(l);
        } catch {
          return null;
        }
      })
      .filter(Boolean);
    // Filtrovat pouze akce kol, ignorovat login/register atd.
    const bikeActions = parsed.map((p) => p.action).filter((a) => a.startsWith('bike_'));
    expect(bikeActions).toEqual(
      expect.arrayContaining(['bike_create', 'bike_update', 'bike_soft_delete', 'bike_restore'])
    );
  });
});

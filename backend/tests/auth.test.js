jest.setTimeout(20000);
const request = require('supertest');
const app = require('..');
const User = require('../models/User');
const { ensureDb } = require('./helpers/testFactory');

beforeAll(async () => {
  await ensureDb();
});
afterAll(async () => {
  /* global teardown disconnect */
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

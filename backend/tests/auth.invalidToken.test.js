const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('..');
const { ensureDb, createUserAndLogin } = require('./helpers/testFactory');

describe('Auth invalid / expired token scenarios', () => {
  let token;
  beforeAll(async () => {
    await ensureDb();
    const created = await createUserAndLogin('tok');
    token = created.token;
  });

  it('returns 401 for malformed token', async () => {
    const res = await request(app).get('/bikes').set('Authorization', `Bearer ${token}broken`);
    expect(res.statusCode).toBe(401);
    expect(res.body).toMatchObject({ message: 'Unauthorized' });
  });

  it('returns 401 for expired token', async () => {
    // craft expired token (exp in the past)
    const expired = jwt.sign(
      { id: '507f1f77bcf86cd799439011', role: 'user', exp: Math.floor(Date.now() / 1000) - 10 },
      process.env.JWT_SECRET
    );
    const res = await request(app).get('/bikes').set('Authorization', `Bearer ${expired}`);
    expect(res.statusCode).toBe(401);
  });
});

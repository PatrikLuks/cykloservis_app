const request = require('supertest');
const app = require('..');
const User = require('../models/User');
const { ensureDb } = require('./helpers/testFactory');

describe('Auth /register internal error simulation', () => {
  beforeAll(async () => {
    await ensureDb();
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns 500 SERVER_ERROR when User.findOne rejects', async () => {
    jest.spyOn(User, 'findOne').mockRejectedValueOnce(new Error('boom'));
    const res = await request(app)
      .post('/auth/register')
      .send({ email: `err_${Date.now()}@example.com` });
    expect(res.statusCode).toBe(500);
    expect(res.body).toMatchObject({ code: 'SERVER_ERROR', error: expect.any(String) });
  });
});

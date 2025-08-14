jest.setTimeout(15000);
require('dotenv').config();
const path = require('path');
const request = require('supertest');
const mongoose = require('mongoose');
const User = require('../models/User');
const { ensureDb } = require('./helpers/testFactory');
const jestOpenAPI = require('jest-openapi').default;

// Použijeme hlavní aplikaci (obsahuje middleware, audit logy a error handler)
const app = require('..');

beforeAll(async () => {
  jestOpenAPI(path.join(__dirname, '..', 'openapi.yaml'));
  await ensureDb();
});

afterAll(async () => {
  if (mongoose.connection.readyState === 1) {
    try {
      await mongoose.connection.db.admin().command({ dropDatabase: 1 });
    } catch (e) {
      /* ignore drop error */
    }
    await mongoose.disconnect();
  }
});

describe('Auth API 500 error simulation', () => {
  it('should return 500 ErrorResponse when internal error occurs during login', async () => {
    const spy = jest.spyOn(User, 'findOne').mockRejectedValueOnce(new Error('boom'));
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'x@example.com', password: 'Test123!' });
    expect(res.statusCode).toBe(500);
    expect(res).toSatisfyApiSpec();
    expect(res.body).toHaveProperty('error');
    expect(res.body).toHaveProperty('code', 'SERVER_ERROR');
    spy.mockRestore();
  });
});

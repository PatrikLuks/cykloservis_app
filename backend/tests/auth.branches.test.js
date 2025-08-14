const request = require('supertest');
const app = require('..');
const { ensureDb } = require('./helpers/testFactory');
const User = require('../models/User');

beforeAll(async () => {
  await ensureDb();
});

describe('auth extra branches', () => {
  test('register returns ACCOUNT_EXISTS when already verified', async () => {
    const email = 'verified_' + Date.now() + '@ex.com';
    await User.create({ email, isVerified: true, finallyRegistered: true });
    const res = await request(app).post('/auth/register').send({ email });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('ACCOUNT_EXISTS');
  });

  test('login PASSWORD_NOT_SET when user has no password', async () => {
    const email = 'nopass_' + Date.now() + '@ex.com';
    await User.create({
      email,
      isVerified: true,
      verificationCode: undefined,
      finallyRegistered: false,
    });
    const res = await request(app).post('/auth/login').send({ email, password: 'Aa123456' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('PASSWORD_NOT_SET');
  });

  test('verify-code invalid code because already verified', async () => {
    const email = 'already_' + Date.now() + '@ex.com';
    await User.create({ email, isVerified: true });
    const res = await request(app).post('/auth/verify-code').send({ email, code: '123456' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('ALREADY_VERIFIED');
  });

  test('verify-code invalid code mismatch', async () => {
    const email = 'codebad_' + Date.now() + '@ex.com';
    await User.create({ email, isVerified: false, verificationCode: '654321' });
    const res = await request(app).post('/auth/verify-code').send({ email, code: '123456' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_CODE');
  });

  test('forgot-password USER_NOT_FOUND branch', async () => {
    const email = 'nouser_' + Date.now() + '@ex.com';
    const res = await request(app).post('/auth/forgot-password').send({ email });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('USER_NOT_FOUND');
  });

  test('verify-reset-code INVALID_REQUEST when user missing resetPasswordCode', async () => {
    const email = 'noreset_' + Date.now() + '@ex.com';
    await User.create({ email });
    const res = await request(app).post('/auth/verify-reset-code').send({ email, code: '123456' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_REQUEST');
  });

  test('verify-reset-code INVALID_CODE mismatch', async () => {
    const email = 'badreset_' + Date.now() + '@ex.com';
    await User.create({ email, resetPasswordCode: '999999' });
    const res = await request(app).post('/auth/verify-reset-code').send({ email, code: '123456' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_CODE');
  });
});

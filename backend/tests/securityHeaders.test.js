const request = require('supertest');
const app = require('..');

describe('Security headers', () => {
  it('should include key security headers from helmet', async () => {
    const res = await request(app).get('/');
    expect(res.headers['x-dns-prefetch-control']).toBe('off');
    expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
    expect(res.headers['x-download-options']).toBe('noopen');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  expect(res.headers['x-xss-protection']).toBe('0'); // helmet v6 default
  expect(res.headers['content-security-policy']).toContain("default-src 'self'");
  });
});

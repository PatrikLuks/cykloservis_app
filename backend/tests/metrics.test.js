const request = require('supertest');
const app = require('..');

describe('metrics endpoint', () => {
  it('exposes prometheus metrics including custom counters', async () => {
    // Hit a couple endpoints to increment counters
    await request(app).get('/api/openapi').expect(200);
    await request(app).get('/api/openapi').expect(200);

    const res = await request(app).get('/api/metrics').expect(200);
    expect(res.text).toMatch(/cyklo_http_requests_total/);
    expect(res.text).toMatch(/cyklo_http_request_duration_ms_bucket/);
  });
});

const request = require('supertest');
const app = require('..');
const { APDEX_T } = require('../metrics');

describe('metrics endpoint', () => {
  it('exposes prometheus metrics including custom counters', async () => {
    // Hit a couple endpoints to increment counters
    await request(app).get('/api/openapi').expect(200);
    await request(app).get('/api/openapi').expect(200);

    const res = await request(app).get('/api/metrics').expect(200);
    expect(res.text).toMatch(/cyklo_http_requests_total/);
    expect(res.text).toMatch(/cyklo_http_request_duration_ms_bucket/);
  });

  it('exposes new apdex & status class metrics', async () => {
    await request(app).get('/api/health/health');
    const res = await request(app).get('/api/metrics').expect(200);
    expect(res.text).toMatch(/cyklo_apdex_total/);
    expect(res.text).toMatch(/cyklo_apdex_satisfied_total/);
    expect(res.text).toMatch(/cyklo_http_status_class_total/);
    expect(APDEX_T).toBeGreaterThan(0);
  // optional diagnostic gauge for last request id
  expect(res.text).toMatch(/cyklo_last_request_id_info/);
  });
});

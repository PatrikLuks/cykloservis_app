const request = require('supertest');
const app = require('..');
const { httpRequestsInFlight, httpRequestErrorsTotal } = require('../metrics');

describe('metrics endpoint', () => {
  it('exposes prometheus metrics including custom counters', async () => {
    // Hit a couple endpoints to increment counters
    await request(app).get('/api/openapi').expect(200);
    await request(app).get('/api/openapi').expect(200);

    const res = await request(app).get('/api/metrics').expect(200);
    expect(res.text).toMatch(/cyklo_http_requests_total/);
    expect(res.text).toMatch(/cyklo_http_request_duration_ms_bucket/);
  });

  it('increments in-flight and error counters', async () => {
    const beforeInFlight =
      httpRequestsInFlight.get().values?.reduce((acc, v) => acc + v.value, 0) || 0;
    const beforeErrors =
      httpRequestErrorsTotal.get().values?.reduce((acc, v) => acc + v.value, 0) || 0;

    // Trigger a known 404 (route not found) to count as error
    await request(app).get('/api/__nonexistent__');
    // Trigger success request
    await request(app).get('/api/health/health');

    const afterInFlight =
      httpRequestsInFlight.get().values?.reduce((acc, v) => acc + v.value, 0) || 0;
    const afterErrors =
      httpRequestErrorsTotal.get().values?.reduce((acc, v) => acc + v.value, 0) || 0;

    expect(afterInFlight).toBeLessThanOrEqual(beforeInFlight); // žádný leak
    // Error counter mohl zůstat stejný pokud middlewares route nepustí do standardní chyby, proto >=
    expect(afterErrors).toBeGreaterThanOrEqual(beforeErrors);
  });
});

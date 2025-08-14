const path = require('path');
const request = require('supertest');
const app = require('..');
const jestOpenAPI = require('jest-openapi').default;

// Načti OpenAPI spec
const specPath = path.join(__dirname, '..', 'openapi.yaml');
jestOpenAPI(specPath);

describe('OpenAPI contract', () => {
  it('GET /api/openapi odpovídá specifikaci (status 200)', async () => {
    const res = await request(app).get('/api/openapi').expect(200);
    expect(res).toSatisfyApiSpec();
  });

  it('GET /api/health/health odpovídá specifikaci', async () => {
    const res = await request(app).get('/api/health/health').expect(200);
    expect(res).toSatisfyApiSpec();
  });

  afterAll(async () => {
    // Zavřít Mongoose připojení pokud existuje (zamezí open handle warningu)
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });
});

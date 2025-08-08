const request = require('supertest');
const express = require('express');
const router = require('../routes/serviceRequests');

const app = express();
app.use(express.json());
app.use('/service-requests', router);

describe('ServiceRequests auth', () => {
  test('GET /service-requests without token -> 401', async () => {
    const res = await request(app).get('/service-requests');
    expect([401,403]).toContain(res.statusCode);
  });
});

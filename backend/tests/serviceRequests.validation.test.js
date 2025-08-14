const request = require('supertest');
const app = require('..');
const { ensureDb, createUserAndLogin } = require('./helpers/testFactory');

describe('Service requests validation', () => {
  let token;
  beforeAll(async () => {
    await ensureDb();
    const created = await createUserAndLogin('srvval');
    token = created.token;
  });

  it('400 VALIDATION_ERROR when missing required bikeId/title', async () => {
    const res = await request(app)
      .post('/service-requests')
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(res.statusCode).toBe(400);
    expect(res.body).toMatchObject({ code: 'VALIDATION_ERROR' });
  });

  it('400 VALIDATION_ERROR invalid bikeId format', async () => {
    const res = await request(app)
      .post('/service-requests')
      .set('Authorization', `Bearer ${token}`)
      .send({ bikeId: '123', title: 'X' });
    expect(res.statusCode).toBe(400);
    expect(res.body).toMatchObject({ code: 'VALIDATION_ERROR' });
  });
});

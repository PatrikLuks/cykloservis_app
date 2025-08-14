const request = require('supertest');
const app = require('..');
const { ensureDb, createUserAndLogin } = require('./helpers/testFactory');
const mongoose = require('mongoose');

jest.setTimeout(60000);
beforeAll(async () => {
  try {
    await ensureDb();
    // eslint-disable-next-line no-console
    console.log('[bikes.branches.test] ensureDb ok, readyState=', mongoose.connection.readyState);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[bikes.branches.test] ensureDb failed', e);
    throw e;
  }
});

describe('bikes extra branches', () => {
  test('restore 404 when bike not soft-deleted', async () => {
    const { token } = await createUserAndLogin('brest1');
    const createRes = await request(app)
      .post('/bikes')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'T1' })
      .expect(201);
    const id = createRes.body._id || createRes.body.id;
    const res = await request(app)
      .post(`/bikes/${id}/restore`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  test('hard delete forbidden for non-admin', async () => {
    const { token } = await createUserAndLogin('bhard1');
    const createRes = await request(app)
      .post('/bikes')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'T2' })
      .expect(201);
    const id = createRes.body._id || createRes.body.id;
    const res = await request(app)
      .delete(`/bikes/${id}/hard`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  test('hard delete 404 for admin non-existing', async () => {
    const { token, email } = await createUserAndLogin('bhard2');
    // promote to admin directly
    const User = require('../models/User');
    await User.updateOne({ email }, { role: 'admin' });
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .delete(`/bikes/${fakeId}/hard`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});

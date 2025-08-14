const request = require('supertest');
const app = require('..');
const mongoose = require('mongoose');
const { ensureDb, createUserAndLogin, createBike } = require('./helpers/testFactory');
const User = require('../models/User');
const Bike = require('../models/Bike');

jest.setTimeout(30000);

beforeAll(async () => {
  await ensureDb();
});
afterAll(async () => {
  /* global teardown */
});

describe('Additional branch coverage scenarios', () => {
  it('admin cannot degrade self role', async () => {
    const email = `admin_${Date.now()}@ex.com`;
    await request(app).post('/auth/register').send({ email }).expect(201);
    await request(app)
      .post('/auth/save-password')
      .send({ email, password: 'Aa123456' })
      .expect(200);
    // Make user admin directly in DB
    await User.updateOne(
      { email },
      {
        role: 'admin',
        verificationCode: '123456',
        isVerified: true,
        passwordHash: '$2a$10$abcdefghijklmnopqrstuv',
      }
    );
    // Fake complete profile flags
    const tokenRes = await request(app)
      .post('/auth/login')
      .send({ email, password: 'Aa123456' })
      .expect(200);
    const token = tokenRes.body.token;
    const me = await User.findOne({ email });
    const res = await request(app)
      .post(`/admin/users/${me._id.toString()}/role`)
      .set('Authorization', `Bearer ${token}`)
      .send({ role: 'user' });
    expect(res.status).toBe(403);
  });

  it('bikes POST rejects invalid base64 image format', async () => {
    const { token } = await createUserAndLogin('imgbad');
    const res = await request(app)
      .post('/bikes')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'X', imageUrl: 'data:image/png;BAD,xxxx' });
    expect(res.status).toBe(400);
  });

  it('bikes POST rejects decoded oversize image', async () => {
    const { token } = await createUserAndLogin('imgover');
    // create base64 ~ > MAX_IMAGE_DECODED_BYTES by repeating 'A'
    const big = 'data:image/png;base64,' + 'A'.repeat(1400000); // triggers length path then decoded size path
    const res = await request(app)
      .post('/bikes')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Y', imageUrl: big });
    expect([413, 400]).toContain(res.status); // depending on which limit hits first
  });

  it('service request update status 404 for non-existing id', async () => {
    const { token } = await createUserAndLogin('srv404');
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .put(`/service-requests/${fakeId}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'done' });
    expect(res.status).toBe(404);
  });

  it('bike PUT 404 when updating non-owned or deleted', async () => {
    const { token } = await createUserAndLogin('bike404');
    const otherId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .put(`/bikes/${otherId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Z' });
    expect(res.status).toBe(404);
  });
});

jest.setTimeout(15000);
const request = require('supertest');
const app = require('..');
const User = require('../models/User');
const { ensureDb } = require('./helpers/testFactory');

describe('Bikes upload strict magic', () => {
  let token;
  beforeAll(async () => {
    process.env.STRICT_UPLOAD_MAGIC = '1';
    await ensureDb();
    const email = `strict_upload_${Date.now()}@example.com`;
    await request(app).post('/auth/register').send({ email });
    const user = await User.findOne({ email });
    user.isVerified = true;
    user.password = '$2a$10$abcdefghijklmnopqrstuv';
    await user.save();
    await request(app).post('/auth/save-password').send({ email, password: 'Secret123' });
    const loginRes = await request(app).post('/auth/login').send({ email, password: 'Secret123' });
    token = loginRes.body.token;
  });

  function auth() {
    return { Authorization: `Bearer ${token}` };
  }

  it('rejects file with mismatched magic (claims png header only)', async () => {
    const create = await request(app).post('/bikes').set(auth()).send({ title: 'Strict One' });
    expect(create.statusCode).toBe(201);
    const bid = create.body.id;
    // Buffer který má jen PNG signature bez dalších chunků – file-type vrátí null => striktní mód odmítne
    const buf = Buffer.from('89504E470D0A1A0A', 'hex');
    const up = await request(app)
      .post(`/bikes/${bid}/image`)
      .set(auth())
      .attach('image', buf, 'fake.png');
    expect(up.statusCode).toBe(400);
    expect(up.body).toHaveProperty('code');
  });
});

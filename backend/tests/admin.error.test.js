const request = require('supertest');
const app = require('..');
const User = require('../models/User');
const { ensureDb, createUserAndLogin } = require('./helpers/testFactory');

describe('Admin endpoints 500 simulations', () => {
  let adminToken;
  beforeAll(async () => {
    await ensureDb();
    const { token, email } = await createUserAndLogin('adm500');
    const u = await User.findOne({ email });
    u.role = 'admin';
    await u.save();
    adminToken = token; // token payload role may still be user but role is re-fetched from DB each request
  });
  afterEach(() => jest.restoreAllMocks());

  it('GET /admin/users -> 500 when User.find rejects', async () => {
    jest.spyOn(User, 'find').mockImplementationOnce(() => ({
      sort: () => {
        throw new Error('boom');
      },
    }));
    const res = await request(app).get('/admin/users').set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(500);
    expect(res.body).toMatchObject({ code: 'SERVER_ERROR' });
  });

  it('POST /admin/users/:id/role -> 500 when findByIdAndUpdate rejects', async () => {
    const anyId = (await User.findOne())._id.toString();
    jest.spyOn(User, 'findByIdAndUpdate').mockRejectedValueOnce(new Error('boom2'));
    const res = await request(app)
      .post(`/admin/users/${anyId}/role`)
      .set('Authorization', `Bearer ${adminToken}`)
      // posíláme stejnou roli 'admin' => vyhneme se self-degrade 403 větvi a chyta se náš mock
      .send({ role: 'admin' });
    expect(res.statusCode).toBe(500);
    expect(res.body).toMatchObject({ code: 'SERVER_ERROR' });
  });
});

const request = require('supertest');
const app = require('../index');
const mongoose = require('mongoose');
const { ensureDb, createUserAndLogin, createBike, elevateToAdmin } = require('./helpers/testFactory');

/** Focused tests for admin filtering & unauthorized scenarios */
describe('admin filtering focused', () => {
  let adminToken; let userToken; let adminEmail; let userEmail; let createdBikes = [];
  beforeAll(async () => {
    await ensureDb();
    adminEmail = 'admin.filter+'+Date.now()+'@ex.com';
    userEmail = 'user.filter+'+Date.now()+'@ex.com';
  const admin = await createUserAndLogin('admin_filter');
  await elevateToAdmin(admin.email); // povýšíme na admina
  const user = await createUserAndLogin('user_filter');
  adminToken = admin.token; userToken = user.token; adminEmail = admin.email; userEmail = user.email;

  // create some bikes just to exercise unrelated data creation (not used in filter assertions now)
  await createBike(userToken, 'Roadster');
  await createBike(adminToken, 'AdminBike');
  });

  afterAll(async () => { await mongoose.connection.close(); });

  test('non-admin cannot use admin listing endpoint even with filters', async () => {
    const res = await request(app)
      .get('/admin/users?email='+encodeURIComponent(userEmail))
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(403); // forbidden
  });

  test('admin can filter by ownerEmail', async () => {
    const res = await request(app)
      .get('/admin/users?email='+encodeURIComponent(userEmail))
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
    expect(res.body[0].email).toBe(userEmail);
  });

  test('admin filtering with no match returns empty array', async () => {
    const res = await request(app)
      .get('/admin/users?email='+encodeURIComponent('none+'+Date.now()+'@ex.com'))
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(0);
  });
});

const request = require('supertest');
const app = require('..');
const { ensureDb, createUserAndLogin } = require('./helpers/testFactory');

beforeAll(async () => {
  await ensureDb();
});

describe('errorHandler extra branches', () => {
  it('handles multer LIMIT_FILE_SIZE (413)', async () => {
    const { token } = await createUserAndLogin('ehmulter');
    // vytvořit bike pro upload
    const bikeRes = await request(app)
      .post('/bikes')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'WithImage' })
      .expect(201);
    const bikeId = bikeRes.body._id || bikeRes.body.id;
    // vytvořit velký buffer > 1MB
    const bigBuffer = Buffer.alloc(1_200_000, 0x41); // 1.2MB
    const res = await request(app)
      .post(`/bikes/${bikeId}/image`)
      .set('Authorization', `Bearer ${token}`)
      .attach('image', bigBuffer, { filename: 'big.png', contentType: 'image/png' });
    expect(res.status).toBe(413);
    expect(res.body).toMatchObject({ code: 'PAYLOAD_TOO_LARGE' });
  });

  it('rejects unsupported mimetype (fileFilter)', async () => {
    const { token } = await createUserAndLogin('ehmime');
    const bikeRes = await request(app)
      .post('/bikes')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Bike2' })
      .expect(201);
    const bikeId = bikeRes.body._id || bikeRes.body.id;
    const buf = Buffer.from('hello');
    const res = await request(app)
      .post(`/bikes/${bikeId}/image`)
      .set('Authorization', `Bearer ${token}`)
      .attach('image', buf, { filename: 'x.txt', contentType: 'text/plain' });
    // fileFilter vrátí Error => zachytí multer -> default 500 naše errorHandler code SERVER_ERROR
    expect([400, 500]).toContain(res.status); // 500 expected, 400 pokud by validace něco zachytila
  });
});

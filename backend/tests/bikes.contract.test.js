const path = require('path');
const request = require('supertest');
const app = require('..');
const jestOpenAPI = require('jest-openapi').default;
const mongoose = require('mongoose');
const { createUserAndLogin } = require('./helpers/testFactory');

jestOpenAPI(path.join(__dirname, '..', 'openapi.yaml'));

describe('Bikes contract', () => {
  let token;

  beforeAll(async () => {
    const { token: t } = await createUserAndLogin('test_bike');
    token = t;
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      try {
        await mongoose.connection.db.admin().command({ dropDatabase: 1 });
      } catch (e) {
        /* ignore drop */
      }
      await mongoose.disconnect();
    }
  });

  it('GET /bikes bez tokenu vrací 401', async () => {
    const res = await request(app).get('/bikes').expect(401);
    expect(res).toSatisfyApiSpec();
  });

  it('POST /bikes s tokenem vytvoří kolo (201)', async () => {
    const res = await request(app)
      .post('/bikes')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Moje kolo', type: 'mtb' })
      .expect(201);
    expect(res).toSatisfyApiSpec();
    // Ověř id alias a odstranění _id
    expect(res.body.id).toBeDefined();
    expect(res.body._id).toBeUndefined();
  });

  it('GET /bikes vrací 500 při simulovaném selhání DB (mock find)', async () => {
    const Bike = require('../models/Bike');
    const original = Bike.find;
    jest.spyOn(Bike, 'find').mockImplementationOnce(() => ({
      sort: () => {
        throw new Error('Find fail');
      },
    }));
    const res = await request(app)
      .get('/bikes')
      .set('Authorization', `Bearer ${token}`)
      .expect(500);
    expect(res).toSatisfyApiSpec();
    // restore
    Bike.find = original;
  });

  it('POST /bikes vrací 400 při neplatném formátu imageUrl', async () => {
    const res = await request(app)
      .post('/bikes')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Kolo s obrázkem', imageUrl: 'data:image/png;base64,@@@@' })
      .expect(400);
    expect(res).toSatisfyApiSpec();
  });

  it('GET /bikes/{id} neexistující vrací 404', async () => {
    const fakeId = '689ddd2edf2f3dce13f3ef5d';
    const res = await request(app)
      .get(`/bikes/${fakeId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
    expect(res).toSatisfyApiSpec();
  });

  it('POST /bikes vrací 413 při příliš dlouhém base64 image', async () => {
    const longBase64 = 'data:image/png;base64,' + 'A'.repeat(1_300_000); // překročí MAX_IMAGE_BASE64_LENGTH
    const res = await request(app)
      .post('/bikes')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Kolo s velkým obrázkem', imageUrl: longBase64 })
      .expect(413);
    expect(res).toSatisfyApiSpec();
  });

  it('PUT /bikes/{id} vrací 413 při příliš dlouhém base64 image', async () => {
    // Nejprve vytvoříme kolo
    const create = await request(app)
      .post('/bikes')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Pro update test' })
      .expect(201);
    const bikeId = create.body.id;
    const longBase64 = 'data:image/png;base64,' + 'A'.repeat(1_300_000);
    const res = await request(app)
      .put(`/bikes/${bikeId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ imageUrl: longBase64 })
      .expect(413);
    expect(res).toSatisfyApiSpec();
  });

  it('POST /bikes vrací 409 při dosažení limitu kol', async () => {
    process.env.MAX_BIKES_PER_USER = '1';
    // V testu už jsme jedno kolo vytvořili, další by mělo vyvolat 409
    const res = await request(app)
      .post('/bikes')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'nad limit' })
      .expect(409);
    expect(res).toSatisfyApiSpec();
    // Reset limit pro další testy
    process.env.MAX_BIKES_PER_USER = '100';
  });

  it('POST /bikes/{id}/image vrací 413 při příliš velkém souboru (multipart)', async () => {
    process.env.MAX_BIKES_PER_USER = '100';
    // vytvořit nové kolo
    const create = await request(app)
      .post('/bikes')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Pro upload test' })
      .expect(201);
    const bikeId = create.body.id;
    const bigBuffer = Buffer.alloc(1_100_000, 0x41); // > 1MB
    const res = await request(app)
      .post(`/bikes/${bikeId}/image`)
      .set('Authorization', `Bearer ${token}`)
      .attach('image', bigBuffer, { filename: 'big.png', contentType: 'image/png' })
      .expect(413);
    expect(res).toSatisfyApiSpec();
  });

  it('POST /bikes vrací 500 při simulovaném selhání DB (mock)', async () => {
    process.env.MAX_BIKES_PER_USER = '100';
    const Bike = require('../models/Bike');
    jest.spyOn(Bike, 'create').mockRejectedValueOnce(new Error('Simulated failure'));
    const res = await request(app)
      .post('/bikes')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Chyba' })
      .expect(500);
    expect(res).toSatisfyApiSpec();
  });

  it('PUT /bikes/{id} vrací 500 při simulovaném selhání DB (mock findOneAndUpdate)', async () => {
    process.env.MAX_BIKES_PER_USER = '100';
    const Bike = require('../models/Bike');
    // vytvořit reálné kolo
    const create = await request(app)
      .post('/bikes')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Pro 500 update' })
      .expect(201);
    const bikeId = create.body.id;
    const spy = jest
      .spyOn(Bike, 'findOneAndUpdate')
      .mockRejectedValueOnce(new Error('Update fail'));
    const res = await request(app)
      .put(`/bikes/${bikeId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Nový title' })
      .expect(500);
    expect(res).toSatisfyApiSpec();
    spy.mockRestore();
  });

  it('POST /bikes/{id}/image vrací 500 při chybě zápisu souboru (mock writeFile)', async () => {
    process.env.MAX_BIKES_PER_USER = '100';
    const fs = require('fs');
    const Bike = require('../models/Bike');
    const create = await request(app)
      .post('/bikes')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Pro 500 image' })
      .expect(201);
    const bikeId = create.body.id;
    const origWrite = fs.promises.writeFile;
    fs.promises.writeFile = jest.fn().mockRejectedValueOnce(new Error('Disk full'));
    const buffer = Buffer.alloc(1000, 0x41);
    const res = await request(app)
      .post(`/bikes/${bikeId}/image`)
      .set('Authorization', `Bearer ${token}`)
      .attach('image', buffer, { filename: 'img.png', contentType: 'image/png' })
      .expect(500);
    expect(res).toSatisfyApiSpec();
    fs.promises.writeFile = origWrite; // restore
  });
});

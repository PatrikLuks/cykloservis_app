const path = require('path');
const request = require('supertest');
const app = require('..');
const jestOpenAPI = require('jest-openapi').default;
const mongoose = require('mongoose');
const { createUserAndLogin, createBike } = require('./helpers/testFactory');

jestOpenAPI(path.join(__dirname, '..', 'openapi.yaml'));

describe('ServiceRequests contract', () => {
  let token;
  let bikeId;
  let serviceRequestId;

  beforeAll(async () => {
    const { token: t } = await createUserAndLogin('test_sr');
    token = t;
    bikeId = await createBike(token, 'Kolo SR');
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

  it('GET /service-requests bez tokenu vrací 401', async () => {
    const res = await request(app).get('/service-requests').expect(401);
    expect(res).toSatisfyApiSpec();
  });

  it('GET /service-requests vrací 500 při simulovaném selhání DB (mock find)', async () => {
    const ServiceRequest = require('../models/ServiceRequest');
    const orig = ServiceRequest.find;
    jest.spyOn(ServiceRequest, 'find').mockImplementationOnce(() => ({
      sort: () => {
        throw new Error('SR list fail');
      },
    }));
    const res = await request(app)
      .get('/service-requests')
      .set('Authorization', `Bearer ${token}`)
      .expect(500);
    expect(res).toSatisfyApiSpec();
    ServiceRequest.find = orig;
  });

  it('POST /service-requests vytvoří požadavek (201) a vrátí id', async () => {
    const res = await request(app)
      .post('/service-requests')
      .set('Authorization', `Bearer ${token}`)
      .send({ bikeId, title: 'Prohlídka', description: 'Brzdy' })
      .expect(201);
    expect(res).toSatisfyApiSpec();
    expect(res.body.id).toBeDefined();
    expect(res.body._id).toBeUndefined();
    serviceRequestId = res.body.id;
  });

  it('PUT /service-requests/{id}/status aktualizuje stav (200)', async () => {
    const res = await request(app)
      .put(`/service-requests/${serviceRequestId}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'in_progress' })
      .expect(200);
    expect(res).toSatisfyApiSpec();
    expect(res.body.status).toBe('in_progress');
  });

  it('PUT /service-requests/{id}/status s neplatným statusem vrací 400', async () => {
    const res = await request(app)
      .put(`/service-requests/${serviceRequestId}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'zzz' })
      .expect(400);
    expect(res).toSatisfyApiSpec();
  });

  it('DELETE /service-requests/{id} smaže požadavek (200)', async () => {
    const res = await request(app)
      .delete(`/service-requests/${serviceRequestId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(res).toSatisfyApiSpec();
    expect(res.body.ok).toBe(true);
  });

  it('PUT /service-requests/{id}/status na neexistující vrací 404', async () => {
    const res = await request(app)
      .put(`/service-requests/${serviceRequestId}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'done' })
      .expect(404);
    // 404 definováno jen popisem, ale konformní
    expect(res).toSatisfyApiSpec();
  });

  it('POST /service-requests vrací 500 při simulovaném selhání DB (mock)', async () => {
    const ServiceRequest = require('../models/ServiceRequest');
    jest.spyOn(ServiceRequest, 'create').mockRejectedValueOnce(new Error('SR create fail'));
    const res = await request(app)
      .post('/service-requests')
      .set('Authorization', `Bearer ${token}`)
      .send({ bikeId, title: 'Chyba', description: 'X' })
      .expect(500);
    expect(res).toSatisfyApiSpec();
  });

  it('PUT /service-requests/{id}/status vrací 500 při selhání DB (mock findOneAndUpdate)', async () => {
    const ServiceRequest = require('../models/ServiceRequest');
    // vytvořit nový SR
    const sr = await request(app)
      .post('/service-requests')
      .set('Authorization', `Bearer ${token}`)
      .send({ bikeId, title: 'Do update', description: 'Y' })
      .expect(201);
    const id = sr.body.id;
    jest
      .spyOn(ServiceRequest, 'findOneAndUpdate')
      .mockRejectedValueOnce(new Error('SR update fail'));
    const res = await request(app)
      .put(`/service-requests/${id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'done' })
      .expect(500);
    expect(res).toSatisfyApiSpec();
  });
});

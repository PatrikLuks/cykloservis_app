const mongoose = require('mongoose');
const { createBikeForOwner } = require('../services/bikeService');
const { createServiceRequest, changeStatus, ERROR_CODES } = require('../services/serviceRequestService');
const { ensureDb } = require('./helpers/testFactory');

describe('serviceRequestService', () => {
  beforeAll(async () => {
    await ensureDb();
  });
  afterAll(async () => {
    await mongoose.connection.close();
  });

  it('fails create when bike not owned', async () => {
    const other = await createBikeForOwner('owner1@example.com', { title: 'Cizí kolo' });
    const attempt = await createServiceRequest('owner2@example.com', { bikeId: other.bike.id, title: 'Req', description: 'Test' });
    expect(attempt.error).toBe(ERROR_CODES.BIKE_INVALID);
  });

  it('creates and updates status', async () => {
    const { bike } = await createBikeForOwner('sr@example.com', { title: 'Moje kolo' });
    const created = await createServiceRequest('sr@example.com', { bikeId: bike.id, title: 'Seřízení', description: 'Brzdy' });
    expect(created.serviceRequest).toBeTruthy();
    const upd = await changeStatus('sr@example.com', created.serviceRequest.id, 'in_progress');
    expect(upd.serviceRequest.status).toBe('in_progress');
  });
});

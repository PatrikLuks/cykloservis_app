const mongoose = require('mongoose');
const { ensureDb } = require('./helpers/testFactory');
const repo = require('../repositories/serviceRequestRepository');

describe('serviceRequestRepository', () => {
  beforeAll(async () => { await ensureDb(); });
  afterAll(async () => { await mongoose.connection.close(); });

  test('create and listByOwner ordering desc', async () => {
    const owner = 'sr_'+Date.now()+'@ex.com';
    const Bike = require('../models/Bike');
    const bike = await Bike.create({ ownerEmail: owner, title: 'Bike1' });
    const r1 = await repo.createRequest({ ownerEmail: owner, bikeId: bike.id, title: 'ReqA', description: 'A', status: 'new' });
    const r2 = await repo.createRequest({ ownerEmail: owner, bikeId: bike.id, title: 'ReqB', description: 'B', status: 'new' });
    const list = await repo.listByOwner(owner);
    expect(list[0].id.toString()).toBe(r2.id.toString()); // newest first
    expect(list.length).toBe(2);
  });

  test('findByIdForOwner returns null for foreign owner', async () => {
    const owner = 'sr2_'+Date.now()+'@ex.com';
    const Bike = require('../models/Bike');
    const bike = await Bike.create({ ownerEmail: owner, title: 'Bike2' });
    const created = await repo.createRequest({ ownerEmail: owner, bikeId: bike.id, title: 'ReqX', description: 'X', status: 'new' });
    const foreign = await repo.findByIdForOwner(created.id, 'other_'+owner);
    expect(foreign).toBeNull();
  });

  test('updateStatus and deleteForOwner workflow', async () => {
    const owner = 'sr3_'+Date.now()+'@ex.com';
    const Bike = require('../models/Bike');
    const bike = await Bike.create({ ownerEmail: owner, title: 'Bike3' });
    const created = await repo.createRequest({ ownerEmail: owner, bikeId: bike.id, title: 'ReqY', description: 'Y', status: 'new' });
    const updated = await repo.updateStatus(created.id, owner, 'done');
    expect(updated.status).toBe('done');
    const deleted = await repo.deleteForOwner(created.id, owner);
    expect(deleted.id.toString()).toBe(created.id.toString());
    const after = await repo.findByIdForOwner(created.id, owner);
    expect(after).toBeNull();
  });
});

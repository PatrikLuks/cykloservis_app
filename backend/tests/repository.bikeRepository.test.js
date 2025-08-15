const mongoose = require('mongoose');
const { ensureDb } = require('./helpers/testFactory');
const {
  createBike,
  listByOwner,
  listDeletedByOwner,
  softDeleteBike,
  restoreBike,
  findByIdForOwner,
} = require('../repositories/bikeRepository');

describe('bikeRepository edge cases', () => {
  beforeAll(async () => { await ensureDb(); });
  afterAll(async () => { await mongoose.connection.close(); });

  test('listByOwner empty result', async () => {
    const res = await listByOwner('noone_'+Date.now()+'@ex.com');
    expect(Array.isArray(res)).toBe(true);
    expect(res.length).toBe(0);
  });

  test('findByIdForOwner invalid ObjectId returns null safely', async () => {
    const res = await findByIdForOwner('invalid-id', 'owner@example.com');
    expect(res).toBeNull();
  });

  test('listDeletedByOwner shows only soft deleted bikes and restore hides again', async () => {
    const owner = 'repo_'+Date.now()+'@ex.com';
    const b1 = await createBike({ ownerEmail: owner, title: 'Kolo1' });
    const b2 = await createBike({ ownerEmail: owner, title: 'Kolo2' });
    await softDeleteBike(b1.id, owner);
    const active = await listByOwner(owner);
    const deleted = await listDeletedByOwner(owner);
    expect(active.find(b=>b.id===b1.id)).toBeFalsy();
    expect(active.find(b=>b.id===b2.id)).toBeTruthy();
    expect(deleted.find(b=>b.id===b1.id)).toBeTruthy();
    expect(deleted.find(b=>b.id===b2.id)).toBeFalsy();
    await restoreBike(b1.id, owner);
    const deletedAfter = await listDeletedByOwner(owner);
    expect(deletedAfter.find(b=>b.id===b1.id)).toBeFalsy();
  });
});

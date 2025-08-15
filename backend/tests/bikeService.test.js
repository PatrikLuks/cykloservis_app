const mongoose = require('mongoose');
const { createBikeForOwner, updateBike, softDelete, restore, ERROR_CODES } = require('../services/bikeService');
const { countByOwner } = require('../repositories/bikeRepository');
const { ensureDb } = require('./helpers/testFactory');

describe('bikeService', () => {
  beforeAll(async () => {
    await ensureDb();
  });
  afterAll(async () => {
    await mongoose.connection.close();
  });

  it('enforces MAX_BIKES_PER_USER', async () => {
    process.env.MAX_BIKES_PER_USER = '1';
    const uniq = `limit_${Date.now()}@example.com`;
    const first = await createBikeForOwner(uniq, { title: 'První kolo' });
    expect(first.bike).toBeTruthy();
    const second = await createBikeForOwner(uniq, { title: 'Druhé kolo' });
    expect(second.error).toBe(ERROR_CODES.MAX_BIKES_REACHED);
    const cnt = await countByOwner(uniq);
    expect(cnt).toBe(1);
  });

  it('updates & soft deletes and restores bike', async () => {
  const uniq = `upd_${Date.now()}@example.com`;
  const { bike } = await createBikeForOwner(uniq, { title: 'Originál' });
  const upd = await updateBike(uniq, bike.id, { title: 'Nový název', color: '  Blue  ' });
    expect(upd.bike.title).toBe('Nový název');
    expect(upd.bike.color).toBe('Blue');
  const del = await softDelete(uniq, bike.id);
    expect(del.bike.deletedAt).toBeTruthy();
  const res = await restore(uniq, bike.id);
    expect(res.bike.deletedAt).toBeFalsy();
  });
});

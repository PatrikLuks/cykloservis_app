const mongoose = require('mongoose');
const { createBikeForOwner, softDelete, restore, hardDeleteBike, ERROR_CODES } = require('../services/bikeService');
const { ensureDb } = require('./helpers/testFactory');

describe('bikeService additional error paths', () => {
  beforeAll(async () => { await ensureDb(); });
  afterAll(async () => { await mongoose.connection.close(); });

  test('restore returns NOT_FOUND when bike is not soft-deleted', async () => {
    const email = `rest_not_deleted_${Date.now()}@ex.com`;
    const { bike } = await createBikeForOwner(email, { title: 'A' });
    const res = await restore(email, bike.id); // not deleted, should fail
    expect(res.error).toBe(ERROR_CODES.NOT_FOUND);
  });

  test('hardDeleteBike non-existing returns null (idempotent delete)', async () => {
    const randomId = new mongoose.Types.ObjectId().toString();
    const del = await hardDeleteBike(randomId);
    expect(del).toBeNull();
  });

  test('restore returns NOT_FOUND for foreign owner / wrong email', async () => {
    const email = `rest_foreign_${Date.now()}@ex.com`;
    const other = `rest_foreign_other_${Date.now()}@ex.com`;
    const { bike } = await createBikeForOwner(email, { title: 'B' });
    await softDelete(email, bike.id);
    const attempt = await restore(other, bike.id); // different owner
    expect(attempt.error).toBe(ERROR_CODES.NOT_FOUND);
  });
});

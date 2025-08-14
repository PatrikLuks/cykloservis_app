// Increase default timeout for potentially slower in-memory Mongo downloads on first run
console.log('[jest.setup] Setting global test timeout to 60000ms');
jest.setTimeout(60000);

// Globální úklid po všech testech (minimalizace open handles)
try {
  const mongoose = require('mongoose');
  const { stopMemory } = require('./helpers/testFactory');
  afterAll(async () => {
    try {
      await mongoose.connection.close();
    } catch (e) {
      /* ignore close */
    }
    try {
      await stopMemory();
    } catch (e) {
      /* ignore stop */
    }
  });
} catch (e) {
  /* ignore require issues */
}

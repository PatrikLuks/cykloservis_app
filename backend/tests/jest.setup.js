// Increase default timeout for potentially slower in-memory Mongo downloads on first run
console.log('[jest.setup] Setting global test timeout to 60000ms');
jest.setTimeout(60000);

// Tlumíme očekávané chybové logy z intentionally failing cest (smtp fail, boom, unsupported image)
const origError = console.error;
console.error = (...args) => {
  const msg = (args && args[0] && String(args[0])) || '';
  if (/smtp fail|Unsupported image type|boom|Audit log error/i.test(msg)) return; // potlačit šum
  origError(...args);
};

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

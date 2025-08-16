const mongoose = require('mongoose');

module.exports = async () => {
  // Zavřít mongoose pokud ještě otevřen
  if (mongoose.connection && mongoose.connection.readyState !== 0) {
    try {
      await mongoose.connection.close();
    } catch (e) {
      /* ignore close */
    }
  }
  // Shutdown případných rate-limiter intervalů (např. pokud FORCE_RATE_LIMIT=1 v některém testu)
  try {
    const app = require('..');
    if (app && Array.isArray(app._rateLimiters)) {
      app._rateLimiters.forEach((lim) => {
        try {
          if (lim && lim.store && typeof lim.store.shutdown === 'function') {
            lim.store.shutdown();
          }
        } catch (_) {
          /* ignore limiter shutdown */
        }
      });
    }
  } catch (e) {
    /* ignore app import */
  }
  // Rate limitery jsou v test prostředí vypnuté; není třeba řešit shutdown store
  // Stop mongodb-memory-server if used
  try {
    const { stopMemory } = require('./helpers/testFactory');
    await stopMemory();
  } catch (e) {
    /* ignore memory stop */
  }
  try {
    const { stopDefaultMetrics } = require('../metrics');
    if (typeof stopDefaultMetrics === 'function') stopDefaultMetrics();
  } catch (e) {
    /* ignore metrics stop */
  }
};

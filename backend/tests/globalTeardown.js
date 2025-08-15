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

require('dotenv').config();
const mongoose = require('mongoose');
const Bike = require('../models/Bike');

(async () => {
  try {
    const DAYS = parseInt(process.env.BIKE_PURGE_DAYS || '30', 10);
    const cutoff = new Date(Date.now() - DAYS * 24 * 60 * 60 * 1000);
    await mongoose.connect(process.env.MONGO_URI);
    const res = await Bike.deleteMany({ deletedAt: { $lte: cutoff } });
    console.log(`Purged ${res.deletedCount} bikes soft-deleted before ${cutoff.toISOString()}`);
  } catch (e) {
    console.error('PURGE ERROR', e);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
})();

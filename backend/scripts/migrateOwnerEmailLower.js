require('dotenv').config();
const mongoose = require('mongoose');
const Bike = require('../models/Bike');

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const cursor = Bike.find({}).cursor();
    let updated = 0;
    for (let doc = await cursor.next(); doc; doc = await cursor.next()) {
      if (doc.ownerEmail && doc.ownerEmail !== doc.ownerEmail.toLowerCase()) {
        doc.ownerEmail = doc.ownerEmail.toLowerCase();
        await doc.save();
        updated++;
      }
    }
    console.log(`OwnerEmail normalization done. Updated: ${updated}`);
  } catch (e) {
    console.error('MIGRATION ERROR', e);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
})();

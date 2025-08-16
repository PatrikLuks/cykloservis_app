#!/usr/bin/env node
require('dotenv').config();
const mongoose = require('mongoose');
const MechanicProfile = require('../models/MechanicProfile');
const User = require('../models/User');

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const email = process.argv[2];
    if (!email) {
      console.log('Použití: node scripts/seedMechanics.js <email-uzivatele-mechanika>');
      process.exit(1);
    }
    const user = await User.findOne({ email });
    if (!user) {
      console.log('Uživatel nenalezen');
      process.exit(1);
    }
    const now = new Date();
    const slots = [];
    for (let d = 1; d <= 5; d++) {
      // 9:00, 11:00, 13:00, 15:00 UTC (přizpůsob si) následujících 5 dní
      [9,11,13,15].forEach(h => {
        const dt = new Date(now.getFullYear(), now.getMonth(), now.getDate() + d, h, 0, 0);
        slots.push(dt);
      });
    }
    const doc = await MechanicProfile.findOneAndUpdate(
      { userId: user._id },
      { userId: user._id, skills: ['servis','odpruzeni'], availableSlots: slots, active: true },
      { upsert: true, new: true }
    );
    console.log('MechanicProfile uložen:', doc._id, 'slotů:', doc.availableSlots.length);
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();

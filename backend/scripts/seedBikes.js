require('dotenv').config();
const mongoose = require('mongoose');
const Bike = require('../models/Bike');

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const sample = [
      {
        title: 'Trek Horské kolo',
        model: 'Bike MX 7206P',
        year: 2022,
        minutesRidden: 148, // 2h 28m
        imageUrl: 'https://images.unsplash.com/photo-1541625602330-2277a4c46182?w=800&q=80',
        ownerEmail: 'demo@example.com'
      },
      {
        title: 'Trek Horské kolo',
        model: 'Bike MX 72026N',
        year: 2022,
        minutesRidden: 148,
        imageUrl: 'https://images.unsplash.com/photo-1518655048521-f130df041f66?w=800&q=80',
        ownerEmail: 'demo@example.com'
      },
      {
        title: 'Trek Horské kolo',
        model: 'Bike MX 7206P',
        year: 2022,
        minutesRidden: 148,
        imageUrl: 'https://images.unsplash.com/photo-1522115174737-52988eb3b5d4?w=800&q=80',
        ownerEmail: 'demo@example.com'
      }
    ];
    await Bike.deleteMany({ ownerEmail: 'demo@example.com' });
    const res = await Bike.insertMany(sample);
    console.log('Inserted bikes:', res.length);
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
})();

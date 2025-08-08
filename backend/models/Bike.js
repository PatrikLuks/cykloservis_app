const mongoose = require('mongoose');

const BikeSchema = new mongoose.Schema({
  title: { type: String, required: true }, // např. "Trek Horské kolo"
  model: { type: String }, // např. "Bike MX 7206P"
  year: { type: Number },
  minutesRidden: { type: Number, default: 0 }, // uchováno v minutách, na FE formátováno jako "2h 28m"
  imageUrl: { type: String },
  ownerEmail: { type: String }, // jednoduchá identifikace vlastníka (MVP bez JWT)
}, { timestamps: true });

module.exports = mongoose.model('Bike', BikeSchema);

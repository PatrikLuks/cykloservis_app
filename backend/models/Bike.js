const mongoose = require('mongoose');

const BikeSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true }, // volné jméno / název
  type: { type: String, trim: true }, // typ kola (horské, silniční, gravel, ...)
  manufacturer: { type: String, trim: true }, // výrobce
  model: { type: String, trim: true }, // model např. "Bike MX 7206P"
  year: { type: Number, min: 1900, max: 2100 },
  minutesRidden: { type: Number, default: 0, min: 0 }, // uchováno v minutách
  imageUrl: { type: String }, // může být URL nebo data: base64 (MVP)
  ownerEmail: { type: String, required: true, index: true, trim: true, lowercase: true }, // identifikace vlastníka
  driveBrand: { type: String, trim: true }, // Značka Pohonu
  driveType: { type: String, trim: true }, // Typ Pohonu
  color: { type: String, trim: true }, // Barva
  brakes: { type: String, trim: true }, // Brzdy
  suspension: { type: String, trim: true }, // Odpružení
  suspensionType: { type: String, trim: true }, // Typ Odpružení
  specs: { type: String, trim: true }, // Specifikace
  deletedAt: { type: Date } // soft delete
}, { timestamps: true });

// Kompozitní index pro časté listování (uživatel + čas vytvoření)
BikeSchema.index({ ownerEmail: 1, createdAt: -1 });
// Index pro filtrování na ne-smazané záznamy
BikeSchema.index({ ownerEmail: 1, deletedAt: 1 });

module.exports = mongoose.model('Bike', BikeSchema);

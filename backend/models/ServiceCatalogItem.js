const mongoose = require('mongoose');

const ServiceCatalogItemSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  category: { type: String },
  baseMinutes: { type: Number, default: 30 },
  basePrice: { type: Number, default: 0 },
  active: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('ServiceCatalogItem', ServiceCatalogItemSchema);

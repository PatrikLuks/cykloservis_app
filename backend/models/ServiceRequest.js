const mongoose = require('mongoose');

const ServiceRequestSchema = new mongoose.Schema({
  ownerEmail: { type: String, required: true, index: true },
  bikeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bike', required: true },
  title: { type: String, required: true },
  description: { type: String },
  status: { type: String, enum: ['new', 'in_progress', 'done', 'cancelled'], default: 'new', index: true },
  preferredDate: { type: Date },
  priceEstimate: { type: Number },
}, { timestamps: true });

module.exports = mongoose.model('ServiceRequest', ServiceRequestSchema);

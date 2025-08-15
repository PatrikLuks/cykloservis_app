/**
 * Copyright (c) 2025 Patrik Luks, Adam Kroupa
 * All rights reserved. Proprietary and confidential.
 * Use, distribution or modification without explicit permission of BOTH authors is strictly prohibited.
 */
const mongoose = require('mongoose');

const ServiceRequestSchema = new mongoose.Schema({
  ownerEmail: { type: String, required: true, index: true },
  bikeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bike', required: true },
  title: { type: String, required: true },
  description: { type: String },
  status: { type: String, enum: ['new', 'in_progress', 'done', 'cancelled'], default: 'new', index: true },
  preferredDate: { type: Date },
  priceEstimate: { type: Number },
}, { timestamps: true, toJSON: { virtuals: true, versionKey: false, transform: (_doc, ret) => {
  if (ret._id) ret.id = String(ret._id);
  delete ret._id;
  return ret;
} } });

module.exports = mongoose.model('ServiceRequest', ServiceRequestSchema);

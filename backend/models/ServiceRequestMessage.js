const mongoose = require('mongoose');

const ServiceRequestMessageSchema = new mongoose.Schema({
  requestId: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceRequest', index: true, required: true },
  senderEmail: { type: String, required: true },
  role: { type: String, enum: ['owner','mechanic','system'], default: 'owner' },
  body: { type: String, required: true },
  read: { type: Boolean, default: false }
}, { timestamps: true });

ServiceRequestMessageSchema.index({ requestId: 1, createdAt: -1 });

module.exports = mongoose.model('ServiceRequestMessage', ServiceRequestMessageSchema);

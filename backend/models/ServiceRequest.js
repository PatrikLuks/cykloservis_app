const mongoose = require('mongoose');

const ServiceRequestSchema = new mongoose.Schema({
  ownerEmail: { type: String, required: true, index: true },
  mechanicId: { type: mongoose.Schema.Types.ObjectId, ref: 'MechanicProfile' },
  serviceTypes: [{ type: String, enum: ['servis','reklamace','odpruzeni'] }],
  deferredBike: { type: Boolean, default: false },
  bikeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bike', required: function() { return !this.deferredBike; } },
  title: { type: String, required: true },
  description: { type: String },
  status: { type: String, enum: ['new', 'in_progress', 'done', 'cancelled'], default: 'new', index: true },
  preferredDate: { type: Date }, // date user would like
  assignedDate: { type: Date }, // actual confirmed slot
  priceEstimate: { type: Number },
  firstAvailable: { type: Boolean, default: false },
  operations: [{
    code: { type: String }, // reference to catalog item code
    name: { type: String },
    minutes: { type: Number },
    price: { type: Number },
    status: { type: String, enum: ['planned','in_progress','done'], default: 'planned' }
  }],
  componentsDelta: [{
    componentName: { type: String },
    action: { type: String, enum: ['install','replace','remove'] },
    note: { type: String }
  }],
  events: [{
    at: { type: Date, default: Date.now },
    type: { type: String }, // e.g. status_change, created
    from: { type: String },
    to: { type: String },
    note: { type: String },
    by: { type: String } // email or role indicator
  }]
}, { timestamps: true });

ServiceRequestSchema.index({ mechanicId: 1, assignedDate: 1 });
ServiceRequestSchema.index({ status: 1 });
ServiceRequestSchema.index({ ownerEmail: 1, createdAt: -1 });

module.exports = mongoose.model('ServiceRequest', ServiceRequestSchema);

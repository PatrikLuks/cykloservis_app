const mongoose = require('mongoose');

const MechanicProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
  skills: [{ type: String, enum: ['servis','reklamace','odpruzeni'], index: true }],
  availableSlots: [{ type: Date }], // explicit UTC datetimes when mechanic can take an order
  active: { type: Boolean, default: true },
  note: { type: String },
  avatarUrl: { type: String }
}, { timestamps: true });

MechanicProfileSchema.index({ skills: 1, active: 1 });
MechanicProfileSchema.index({ availableSlots: 1 });

module.exports = mongoose.model('MechanicProfile', MechanicProfileSchema);

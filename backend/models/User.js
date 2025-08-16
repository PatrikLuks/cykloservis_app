const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String },
  isVerified: { type: Boolean, default: false },
  verificationCode: { type: String }, // 6-místný kód pro ověření emailu
  firstName: { type: String },
  lastName: { type: String },
  birthDate: { type: Date },
  gender: { type: String },
  location: { type: String },
  avatarUrl: { type: String },
  phoneCountryCode: { type: String },
  phoneNumber: { type: String },
  resetPasswordCode: { type: String },
  finallyRegistered: { type: Boolean, default: false },
  role: { type: String, default: 'user', enum: ['user','mechanic','admin'] }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);

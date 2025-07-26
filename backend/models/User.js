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
  resetPasswordCode: { type: String }
});

module.exports = mongoose.model('User', UserSchema);

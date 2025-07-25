const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isVerified: { type: Boolean, default: false },
  verificationToken: { type: String },
  firstName: { type: String },
  lastName: { type: String },
  birthDate: { type: Date },
  gender: { type: String },
  address: { type: String },
  city: { type: String },
  zip: { type: String }
});

module.exports = mongoose.model('User', UserSchema);

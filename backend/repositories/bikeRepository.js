// Bike repository – izoluje práci s kolekcí kol (prostor pro případné cachování / refactor)
const Bike = require('../models/Bike');

async function listByOwner(ownerEmail) {
  return Bike.find({ ownerEmail, deletedAt: { $exists: false } }).sort({ createdAt: -1 });
}

async function listDeletedByOwner(ownerEmail) {
  return Bike.find({ ownerEmail, deletedAt: { $exists: true } }).sort({ deletedAt: -1 });
}

async function countByOwner(ownerEmail) {
  return Bike.countDocuments({ ownerEmail });
}

async function findByIdForOwner(id, ownerEmail, includeDeleted = false) {
  // Gracefully handle invalid ObjectId inputs (return null instead of throwing CastError)
  const mongoose = require('mongoose');
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  const query = { _id: id, ownerEmail };
  if (!includeDeleted) query.deletedAt = { $exists: false };
  return Bike.findOne(query);
}

async function createBike(data) {
  return Bike.create(data);
}

async function updateBikeForOwner(id, ownerEmail, update) {
  return Bike.findOneAndUpdate(
    { _id: id, ownerEmail, deletedAt: { $exists: false } },
    { $set: update },
    { new: true, runValidators: true }
  );
}

async function softDeleteBike(id, ownerEmail) {
  return Bike.findOneAndUpdate(
    { _id: id, ownerEmail, deletedAt: { $exists: false } },
    { $set: { deletedAt: new Date() } },
    { new: true }
  );
}

async function restoreBike(id, ownerEmail) {
  return Bike.findOneAndUpdate(
    { _id: id, ownerEmail, deletedAt: { $exists: true } },
    { $unset: { deletedAt: 1 } },
    { new: true }
  );
}

async function hardDeleteBike(id) {
  return Bike.findOneAndDelete({ _id: id });
}

module.exports = {
  listByOwner,
  listDeletedByOwner,
  countByOwner,
  findByIdForOwner,
  createBike,
  updateBikeForOwner,
  softDeleteBike,
  restoreBike,
  hardDeleteBike,
};

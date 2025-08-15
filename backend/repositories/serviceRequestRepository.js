// ServiceRequest repository – izolace přístupu k servisním požadavkům
const ServiceRequest = require('../models/ServiceRequest');

async function listByOwner(ownerEmail) {
  return ServiceRequest.find({ ownerEmail }).sort({ createdAt: -1 });
}

async function createRequest(data) {
  return ServiceRequest.create(data);
}

async function findByIdForOwner(id, ownerEmail) {
  return ServiceRequest.findOne({ _id: id, ownerEmail });
}

async function updateStatus(id, ownerEmail, status) {
  return ServiceRequest.findOneAndUpdate(
    { _id: id, ownerEmail },
    { status },
    { new: true }
  );
}

async function deleteForOwner(id, ownerEmail) {
  return ServiceRequest.findOneAndDelete({ _id: id, ownerEmail });
}

module.exports = {
  listByOwner,
  createRequest,
  findByIdForOwner,
  updateStatus,
  deleteForOwner,
};

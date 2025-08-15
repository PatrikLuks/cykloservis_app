// ServiceRequest service – logika ověřující vlastnictví kola & přechody stavů
const { listByOwner, createRequest, updateStatus, deleteForOwner } = require('../repositories/serviceRequestRepository');
const { findByIdForOwner: findBikeForOwner } = require('../repositories/bikeRepository');

const ERROR_CODES = {
  BIKE_INVALID: 'BIKE_INVALID',
  NOT_FOUND: 'NOT_FOUND',
};

async function createServiceRequest(ownerEmail, data) {
  ownerEmail = ownerEmail.toLowerCase();
  const bike = await findBikeForOwner(data.bikeId, ownerEmail);
  if (!bike || bike.deletedAt) return { error: ERROR_CODES.BIKE_INVALID };
  const payload = { ...data, ownerEmail };
  const serviceRequest = await createRequest(payload);
  return { serviceRequest };
}

async function listOwnerRequests(ownerEmail) {
  return listByOwner(ownerEmail.toLowerCase());
}

async function changeStatus(ownerEmail, id, status) {
  const updated = await updateStatus(id, ownerEmail.toLowerCase(), status);
  if (!updated) return { error: ERROR_CODES.NOT_FOUND };
  return { serviceRequest: updated };
}

async function deleteRequest(ownerEmail, id) {
  await deleteForOwner(id, ownerEmail.toLowerCase());
  return { ok: true };
}

module.exports = {
  ERROR_CODES,
  createServiceRequest,
  listOwnerRequests,
  changeStatus,
  deleteRequest,
};

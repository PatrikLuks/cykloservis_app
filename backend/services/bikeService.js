// Bike service – business logika (limit počtu kol, sanitace, ochrana ownerEmail)
const {
  listByOwner,
  listDeletedByOwner,
  countByOwner,
  findByIdForOwner,
  createBike,
  updateBikeForOwner,
  softDeleteBike,
  restoreBike,
  hardDeleteBike,
} = require('../repositories/bikeRepository');

const ERROR_CODES = {
  MAX_BIKES_REACHED: 'MAX_BIKES_REACHED',
  NOT_FOUND: 'NOT_FOUND',
};

const STRING_FIELDS = [
  'title',
  'type',
  'manufacturer',
  'model',
  'driveBrand',
  'driveType',
  'color',
  'brakes',
  'suspension',
  'suspensionType',
  'specs',
  'imageUrl',
];

function sanitize(payload) {
  const out = { ...payload };
  STRING_FIELDS.forEach((k) => {
    if (typeof out[k] === 'string') {
      out[k] = out[k].trim();
      if (out[k] === '') delete out[k];
    }
  });
  if (out.ownerEmail) out.ownerEmail = out.ownerEmail.toLowerCase();
  return out;
}

function getMaxBikesPerUser() {
  return parseInt(process.env.MAX_BIKES_PER_USER || '100', 10);
}

async function createBikeForOwner(ownerEmail, data) {
  ownerEmail = ownerEmail.toLowerCase();
  const count = await countByOwner(ownerEmail);
  if (count >= getMaxBikesPerUser()) {
    return { error: ERROR_CODES.MAX_BIKES_REACHED };
  }
  const payload = sanitize({ ...data, ownerEmail });
  const bike = await createBike(payload);
  return { bike };
}

async function updateBike(ownerEmail, id, update) {
  const sanitized = sanitize(update);
  delete sanitized.ownerEmail;
  const bike = await updateBikeForOwner(id, ownerEmail.toLowerCase(), sanitized);
  if (!bike) return { error: ERROR_CODES.NOT_FOUND };
  return { bike };
}

async function getBike(ownerEmail, id) {
  return findByIdForOwner(id, ownerEmail.toLowerCase());
}

async function listOwnerBikes(ownerEmail) {
  return listByOwner(ownerEmail.toLowerCase());
}

async function listOwnerDeletedBikes(ownerEmail) {
  return listDeletedByOwner(ownerEmail.toLowerCase());
}

async function softDelete(ownerEmail, id) {
  const bike = await softDeleteBike(id, ownerEmail.toLowerCase());
  if (!bike) return { error: ERROR_CODES.NOT_FOUND };
  return { bike };
}

async function restore(ownerEmail, id) {
  const bike = await restoreBike(id, ownerEmail.toLowerCase());
  if (!bike) return { error: ERROR_CODES.NOT_FOUND };
  return { bike };
}

module.exports = {
  ERROR_CODES,
  createBikeForOwner,
  updateBike,
  getBike,
  listOwnerBikes,
  listOwnerDeletedBikes,
  softDelete,
  restore,
  hardDeleteBike,
};

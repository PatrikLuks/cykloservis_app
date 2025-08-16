const express = require('express');
const router = express.Router();
const { body, validationResult, param } = require('express-validator');
const Bike = require('../models/Bike'); // ponecháno pro image upload specifika
const CODES = require('../utils/errorCodes');
const auditLog = require('../utils/auditLog');
const { requireAuth } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
let fileTypeFromBuffer;
try {
  // Dynamické natažení (minimalizace cold startu pokud se upload nepoužije)
  ({ fileTypeFromBuffer } = require('file-type'));
} catch (e) {
  fileTypeFromBuffer = async () => null; // fallback – nebude přísně validovat
}
// Service layer
const {
  createBikeForOwner,
  updateBike: updateBikeService,
  getBike: getBikeService,
  listOwnerBikes,
  listOwnerDeletedBikes,
  softDelete: softDeleteService,
  restore: restoreService,
  hardDeleteBike,
  ERROR_CODES: BIKE_SERVICE_ERRORS,
} = require('../services/bikeService');

function handleValidation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      error: 'Validation error',
      code: CODES.VALIDATION_ERROR,
      details: { errors: errors.array() },
    });
    return false;
  }
  return true;
}

// Konstanty & pomocné funkce
const MAX_IMAGE_BASE64_LENGTH = 1_200_000; // znaky (~ <1.2MB)
const MAX_IMAGE_DECODED_BYTES = 900_000; // ~0.9MB skutečných dekódovaných dat
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
  return out;
}

// Rate limiter pro vytváření kol (parametrizovatelný ENV proměnnou)
// V testovacím režimu jej vypneme (Jest by jinak hlásil open handles kvůli intervalům uvnitř rate-limiteru)
const { createBikeRateLimit } = require('../config');
const CREATE_BIKE_RATE_MAX = createBikeRateLimit.max;
const isTest = !!process.env.JEST_WORKER_ID;
const createBikeLimiter = isTest
  ? (req, _res, next) => next()
  : rateLimit({
      windowMs: createBikeRateLimit.windowMs,
      max: CREATE_BIKE_RATE_MAX,
      standardHeaders: true,
      legacyHeaders: false,
      message: { error: 'Příliš mnoho požadavků na vytvoření kola. Zkuste to později.' },
    });

// Multer konfigurace pro upload obrázků (MVP: ukládáme na disk)
const uploadDir = process.env.BIKES_UPLOAD_DIR || path.join(process.cwd(), 'uploads', 'bikes');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer.memoryStorage();
const ALLOWED_MIME = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
const upload = multer({
  storage,
  limits: { fileSize: 1_000_000 }, // 1MB
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME.includes(file.mimetype)) {
      return cb(new Error('Unsupported image type'));
    }
    cb(null, true);
  },
});

// GET /bikes - list
router.get('/', requireAuth, async (req, res) => {
  try {
    const items = await listOwnerBikes(req.user.email);
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: 'Server error', code: CODES.SERVER_ERROR });
  }
});

// GET /bikes/deleted - list soft-deleted
router.get('/deleted', requireAuth, async (req, res) => {
  try {
    const items = await listOwnerDeletedBikes(req.user.email);
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: 'Server error', code: CODES.SERVER_ERROR });
  }
});

// POST /bikes - create (nejprve validace vstupu -> potom limit počtu)
router.post(
  '/',
  createBikeLimiter,
  [
    body('title').notEmpty().withMessage('title is required'),
    body('type').optional().isString(),
    body('manufacturer').optional().isString(),
    body('model').optional().isString(),
    body('year').optional().isInt({ min: 1900, max: 2100 }),
    body('minutesRidden').optional().isInt({ min: 0 }),
    body('imageUrl').optional().isString(),
    body('driveBrand').optional().isString(),
    body('driveType').optional().isString(),
    body('color').optional().isString(),
    body('brakes').optional().isString(),
    body('suspension').optional().isString(),
    body('suspensionType').optional().isString(),
    body('specs').optional().isString(),
    body('ownerEmail').optional().isEmail(),
  ],
  requireAuth,
  async (req, res) => {
    if (!handleValidation(req, res)) return;
    try {
      if (req.body.imageUrl) {
        if (req.body.imageUrl.length > MAX_IMAGE_BASE64_LENGTH) {
          return res
            .status(413)
            .json({ error: 'Obrázek je příliš velký (délka)', code: CODES.PAYLOAD_TOO_LARGE });
        }
        const m = req.body.imageUrl.match(
          /^data:image\/(png|jpe?g|webp);base64,([A-Za-z0-9+/=]+)$/
        );
        if (!m) {
          return res
            .status(400)
            .json({ error: 'Neplatný formát obrázku.', code: CODES.VALIDATION_ERROR });
        }
        const b64Payload = m[2];
        const estimatedBytes =
          Math.floor((b64Payload.length * 3) / 4) -
          (b64Payload.endsWith('==') ? 2 : b64Payload.endsWith('=') ? 1 : 0);
        if (estimatedBytes > MAX_IMAGE_DECODED_BYTES) {
          return res
            .status(413)
            .json({ error: 'Obrázek je příliš velký (decoded)', code: CODES.PAYLOAD_TOO_LARGE });
        }
      }
      const payload = sanitize(req.body); // service znovu sanitize provede ownerEmail
      const { bike, error } = await createBikeForOwner(req.user.email, payload);
      if (error === BIKE_SERVICE_ERRORS.MAX_BIKES_REACHED) {
        return res
          .status(409)
          .json({ error: 'Překročen maximální počet kol.', code: CODES.MAX_BIKES_REACHED });
      }
      if (!bike) {
        return res.status(500).json({ error: 'Server error', code: CODES.SERVER_ERROR });
      }
      auditLog('bike_create', req.user.email, { bikeId: bike._id });
      res.status(201).json(bike);
    } catch (err) {
      res.status(500).json({ error: 'Server error', code: CODES.SERVER_ERROR });
    }
  }
);

// GET /bikes/:id
router.get('/:id', [param('id').isMongoId()], requireAuth, async (req, res) => {
  if (!handleValidation(req, res)) return;
  try {
    const doc = await getBikeService(req.user.email, req.params.id);
    if (!doc) return res.status(404).json({ message: 'Not found' });
    auditLog('bike_read', req.user.email, { bikeId: doc._id });
    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: 'Server error', code: CODES.SERVER_ERROR });
  }
});

// PUT /bikes/:id
router.put(
  '/:id',
  [
    param('id').isMongoId(),
    body('title').optional().isString().notEmpty(),
    body('type').optional().isString(),
    body('manufacturer').optional().isString(),
    body('model').optional().isString(),
    body('year').optional().isInt({ min: 1900, max: 2100 }),
    body('minutesRidden').optional().isInt({ min: 0 }),
    body('imageUrl').optional().isString(),
    body('driveBrand').optional().isString(),
    body('driveType').optional().isString(),
    body('color').optional().isString(),
    body('brakes').optional().isString(),
    body('suspension').optional().isString(),
    body('suspensionType').optional().isString(),
    body('specs').optional().isString(),
    body('ownerEmail').optional().isEmail(),
  ],
  requireAuth,
  async (req, res) => {
    if (!handleValidation(req, res)) return;
    try {
      if (req.body.imageUrl) {
        if (req.body.imageUrl.length > MAX_IMAGE_BASE64_LENGTH) {
          return res
            .status(413)
            .json({ error: 'Obrázek je příliš velký (délka)', code: CODES.PAYLOAD_TOO_LARGE });
        }
        const m = req.body.imageUrl.match(
          /^data:image\/(png|jpe?g|webp);base64,([A-Za-z0-9+/=]+)$/
        );
        if (!m) {
          return res
            .status(400)
            .json({ error: 'Neplatný formát obrázku.', code: CODES.VALIDATION_ERROR });
        }
        const b64Payload = m[2];
        const estimatedBytes =
          Math.floor((b64Payload.length * 3) / 4) -
          (b64Payload.endsWith('==') ? 2 : b64Payload.endsWith('=') ? 1 : 0);
        if (estimatedBytes > MAX_IMAGE_DECODED_BYTES) {
          return res
            .status(413)
            .json({ error: 'Obrázek je příliš velký (decoded)', code: CODES.PAYLOAD_TOO_LARGE });
        }
      }
      const { bike, error } = await updateBikeService(
        req.user.email,
        req.params.id,
        sanitize(req.body)
      );
      if (error === BIKE_SERVICE_ERRORS.NOT_FOUND)
        return res.status(404).json({ message: 'Not found' });
      auditLog('bike_update', req.user.email, { bikeId: bike._id });
      res.json(bike);
    } catch (err) {
      res.status(500).json({ error: 'Server error', code: CODES.SERVER_ERROR });
    }
  }
);

// DELETE /bikes/:id - remove
router.delete('/:id', [param('id').isMongoId()], requireAuth, async (req, res) => {
  if (!handleValidation(req, res)) return;
  try {
    const { bike, error } = await softDeleteService(req.user.email, req.params.id);
    if (!bike || error) return res.json({ ok: true, softDeleted: false });
    auditLog('bike_soft_delete', req.user.email, { bikeId: req.params.id });
    res.json({ ok: true, softDeleted: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error', code: CODES.SERVER_ERROR });
  }
});

// POST /bikes/:id/restore - obnova soft-smazaného kola
router.post('/:id/restore', [param('id').isMongoId()], requireAuth, async (req, res) => {
  if (!handleValidation(req, res)) return;
  try {
    const { bike, error } = await restoreService(req.user.email, req.params.id);
    if (error === BIKE_SERVICE_ERRORS.NOT_FOUND)
      return res.status(404).json({ message: 'Not found' });
    auditLog('bike_restore', req.user.email, { bikeId: bike._id });
    res.json(bike);
  } catch (err) {
    res.status(500).json({ error: 'Server error', code: CODES.SERVER_ERROR });
  }
});

// DELETE /bikes/:id/hard - admin trvalé smazání
router.delete('/:id/hard', [param('id').isMongoId()], requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'admin')
      return res.status(403).json({ error: 'Forbidden', code: CODES.FORBIDDEN });
    const doc = await hardDeleteBike(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Not found' });
    auditLog('bike_hard_delete', req.user.email, { bikeId: req.params.id });
    res.json({ ok: true, hardDeleted: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error', code: CODES.SERVER_ERROR });
  }
});

// POST /bikes/:id/image - upload / výměna obrázku (multipart)
router.post(
  '/:id/image',
  [param('id').isMongoId()],
  requireAuth,
  upload.single('image'),
  async (req, res) => {
    if (!req.file)
      return res.status(400).json({
        error: 'Chybí soubor image',
        code: CODES.VALIDATION_ERROR,
        details: { field: 'image' },
      });
    try {
      // Ověření magic bytes (nezávisle na deklarovaném mimetype)
      let detectedExt = 'bin';
      let detectedMime = req.file.mimetype;
      try {
        const detected = await fileTypeFromBuffer(req.file.buffer);
        if (detected && detected.mime) {
          if (!ALLOWED_MIME.includes(detected.mime)) {
            return res
              .status(400)
              .json({ error: 'Neplatný obsah souboru', code: CODES.VALIDATION_ERROR });
          }
          detectedMime = detected.mime;
          if (detected.ext) detectedExt = detected.ext;
        } // pokud nedetekováno (null), fallback na deklarovaný mimetype – už byl propuštěn fileFilterem
      } catch (_) {
        // fallback – pokud sniff selže, pokračujeme (mimetype už prošel fileFilter)
      }
      // Mapování přípon (sjednocení .jpg/.jpeg)
      if (detectedExt === 'jpeg') detectedExt = 'jpg';
      if (!['png', 'jpg', 'webp'].includes(detectedExt)) {
        // fallback podle mimetype pokud sniff nedetekoval ext
        if (detectedMime === 'image/png') detectedExt = 'png';
        else if (detectedMime === 'image/webp') detectedExt = 'webp';
        else detectedExt = 'jpg';
      }
      // Sanitizace generovaného názvu (nepoužíváme původní user-provided filename)
      const rand = crypto.randomBytes(6).toString('hex');
      const filename = `${req.params.id}_${Date.now()}_${rand}.${detectedExt}`;
      const fullPath = path.join(uploadDir, filename);
      await fs.promises.writeFile(fullPath, req.file.buffer);
      const relative = `/uploads/bikes/${filename}`;
      const current = await Bike.findOne({
        _id: req.params.id,
        ownerEmail: req.user.email.toLowerCase(),
      });
      if (!current) return res.status(404).json({ message: 'Not found' });
      const oldImage =
        current.imageUrl && current.imageUrl.startsWith('/uploads/bikes/')
          ? current.imageUrl
          : null;
      current.imageUrl = relative;
      await current.save();
      if (oldImage && oldImage !== relative) {
        const oldPath = path.join(
          process.cwd(),
          oldImage.replace('/uploads/bikes/', 'uploads/bikes/')
        );
        fs.promises.unlink(oldPath).catch(() => {});
      }
      auditLog('bike_image_upload', req.user.email, {
        bikeId: req.params.id,
        filename,
        mime: detectedMime,
      });
      res.json(current);
    } catch (err) {
      res.status(500).json({ error: 'Server error', code: CODES.SERVER_ERROR });
    }
  }
);

module.exports = router;

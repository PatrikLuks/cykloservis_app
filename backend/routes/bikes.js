const express = require('express');
const router = express.Router();
const { body, validationResult, param } = require('express-validator');
const Bike = require('../models/Bike');
const auditLog = require('../utils/auditLog');
const { requireAuth } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const bodyWhitelist = require('../middleware/bodyWhitelist');
const logger = require('../utils/logger');

function handleValidation(req, res) {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		res.status(400).json({ errors: errors.array() });
		return false;
	}
	return true;
}

// Konstanty & pomocné funkce
const MAX_IMAGE_BASE64_LENGTH = 1_200_000; // znaky (~ <1.2MB)
const MAX_IMAGE_DECODED_BYTES = 900_000; // ~0.9MB skutečných dekódovaných dat
const MAX_BIKES_PER_USER = parseInt(process.env.MAX_BIKES_PER_USER || '100', 10);
const STRING_FIELDS = ['title','type','manufacturer','model','driveBrand','driveType','color','brakes','suspension','suspensionType','specs','imageUrl'];

function sanitize(payload) {
	const out = { ...payload };
	STRING_FIELDS.forEach(k => { if (typeof out[k] === 'string') { out[k] = out[k].trim(); if (out[k] === '') delete out[k]; }});
	return out;
}

// Rate limiter pro vytváření kol (parametrizovatelný ENV proměnnou)
const CREATE_BIKE_RATE_MAX = parseInt(process.env.CREATE_BIKE_RATE_MAX || '30', 10);
const createBikeLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: CREATE_BIKE_RATE_MAX,
	standardHeaders: true,
	legacyHeaders: false,
	message: { error: 'Příliš mnoho požadavků na vytvoření kola. Zkuste to později.' }
});

// Multer konfigurace pro upload obrázků (MVP: ukládáme na disk)
const uploadDir = process.env.BIKES_UPLOAD_DIR || path.join(process.cwd(), 'uploads', 'bikes');
if (!fs.existsSync(uploadDir)) {
	fs.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer.memoryStorage();
const upload = multer({
	storage,
	limits: { fileSize: 1_000_000 }, // 1MB
	fileFilter: (req, file, cb) => {
		if (!['image/png','image/jpeg','image/jpg','image/webp'].includes(file.mimetype)) {
			return cb(new Error('Unsupported image type'));
		}
		cb(null, true);
	}
});

// GET /bikes - list
router.get('/', requireAuth, async (req, res) => {
	try {
		const query = { ownerEmail: req.user.email, deletedAt: { $exists: false } };
		const rawLimit = parseInt(req.query.limit, 10);
		const limit = (!isNaN(rawLimit) && rawLimit > 0 && rawLimit <= 100) ? rawLimit : 50;
		const page = parseInt(req.query.page, 10);
		const projection = 'title type manufacturer model year minutesRidden imageUrl createdAt';
		// Backwards compatibility: if no page param -> return plain array as before
		if (!isNaN(page) && page > 0) {
			const skip = (page - 1) * limit;
			const docs = await Bike.find(query).select(projection).sort({ createdAt: -1 }).skip(skip).limit(limit + 1).lean();
			const hasNext = docs.length > limit;
			const data = hasNext ? docs.slice(0, limit) : docs;
			return res.json({ data, pagination: { page, limit, hasNext } });
		}
		const items = await Bike.find(query).select(projection).sort({ createdAt: -1 }).limit(limit).lean();
		res.json(items);
	} catch (err) {
		res.status(500).json({ error: 'Server error' });
	}
});

// GET /bikes/deleted - list soft-deleted
router.get('/deleted', requireAuth, async (req, res) => {
	try {
		const query = { ownerEmail: req.user.email, deletedAt: { $exists: true } };
		const rawLimit = parseInt(req.query.limit, 10);
		const limit = (!isNaN(rawLimit) && rawLimit > 0 && rawLimit <= 100) ? rawLimit : 50;
		const page = parseInt(req.query.page, 10);
		const projection = 'title type manufacturer model year minutesRidden imageUrl deletedAt createdAt';
		if (!isNaN(page) && page > 0) {
			const skip = (page - 1) * limit;
			const docs = await Bike.find(query).select(projection).sort({ deletedAt: -1 }).skip(skip).limit(limit + 1).lean();
			const hasNext = docs.length > limit;
			const data = hasNext ? docs.slice(0, limit) : docs;
			return res.json({ data, pagination: { page, limit, hasNext } });
		}
		const items = await Bike.find(query).select(projection).sort({ deletedAt: -1 }).limit(limit).lean();
		res.json(items);
	} catch (err) {
		res.status(500).json({ error: 'Server error' });
	}
});

// POST /bikes - create
router.post('/',
	createBikeLimiter,
	bodyWhitelist(['title','type','manufacturer','model','year','minutesRidden','imageUrl','driveBrand','driveType','color','brakes','suspension','suspensionType','specs','ownerEmail'], { logFn: (removed)=> logger.warn('BIKE_CREATE_STRIPPED_KEYS', { removed }) }),
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
		body('ownerEmail').optional().isEmail()
	],
	requireAuth,
	async (req, res) => {
		if (!handleValidation(req, res)) return;
		try {
			// Limit počtu kol
			const count = await Bike.countDocuments({ ownerEmail: req.user.email.toLowerCase() });
			if (count >= MAX_BIKES_PER_USER) {
				return res.status(409).json({ error: 'Překročen maximální počet kol.' });
			}
			if (req.body.imageUrl) {
				if (req.body.imageUrl.length > MAX_IMAGE_BASE64_LENGTH) {
					return res.status(413).json({ error: 'Obrázek je příliš velký (délka)' });
				}
				const m = req.body.imageUrl.match(/^data:image\/(png|jpe?g|webp);base64,([A-Za-z0-9+/=]+)$/);
				if (!m) {
					return res.status(400).json({ error: 'Neplatný formát obrázku.' });
				}
				// Odhad skutečné velikosti: každý 4 znaky base64 ~ 3 bajty
				const b64Payload = m[2];
				const estimatedBytes = Math.floor((b64Payload.length * 3) / 4) - (b64Payload.endsWith('==') ? 2 : b64Payload.endsWith('=') ? 1 : 0);
				if (estimatedBytes > MAX_IMAGE_DECODED_BYTES) {
					return res.status(413).json({ error: 'Obrázek je příliš velký (decoded)' });
				}
			}
			const payload = sanitize(req.body);
			payload.ownerEmail = req.user.email.toLowerCase();
			const bike = await Bike.create(payload);
			auditLog('bike_create', req.user.email, { bikeId: bike._id });
			res.status(201).json(bike);
		} catch (err) {
			res.status(500).json({ error: 'Server error' });
		}
	}
);

// GET /bikes/:id
router.get('/:id', [param('id').isMongoId()], requireAuth, async (req, res) => {
	if (!handleValidation(req, res)) return;
	try {
		const doc = await Bike.findOne({ _id: req.params.id, ownerEmail: req.user.email.toLowerCase(), deletedAt: { $exists: false } }).lean();
		if (!doc) return res.status(404).json({ error: 'Not found' });
		auditLog('bike_read', req.user.email, { bikeId: doc._id });
		res.json(doc);
	} catch (err) {
		res.status(500).json({ error: 'Server error' });
	}
});

// PUT /bikes/:id
router.put('/:id', [
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
	body('ownerEmail').optional().isEmail()
], bodyWhitelist(['title','type','manufacturer','model','year','minutesRidden','imageUrl','driveBrand','driveType','color','brakes','suspension','suspensionType','specs','ownerEmail'], { logFn: (removed, _allowed, reqCtx)=> logger.warn('BIKE_UPDATE_STRIPPED_KEYS', { removed, bikeId: reqCtx.params.id }) }), requireAuth, async (req, res) => {
	if (!handleValidation(req, res)) return;
	try {
		if (req.body.imageUrl) {
			if (req.body.imageUrl.length > MAX_IMAGE_BASE64_LENGTH) {
				return res.status(413).json({ error: 'Obrázek je příliš velký (délka)' });
			}
			const m = req.body.imageUrl.match(/^data:image\/(png|jpe?g|webp);base64,([A-Za-z0-9+/=]+)$/);
			if (!m) {
				return res.status(400).json({ error: 'Neplatný formát obrázku.' });
			}
			const b64Payload = m[2];
			const estimatedBytes = Math.floor((b64Payload.length * 3) / 4) - (b64Payload.endsWith('==') ? 2 : b64Payload.endsWith('=') ? 1 : 0);
			if (estimatedBytes > MAX_IMAGE_DECODED_BYTES) {
				return res.status(413).json({ error: 'Obrázek je příliš velký (decoded)' });
			}
		}
		const update = sanitize(req.body);
		delete update.ownerEmail; // nelze měnit vlastníka
		const doc = await Bike.findOneAndUpdate(
			{ _id: req.params.id, ownerEmail: req.user.email.toLowerCase(), deletedAt: { $exists: false } },
			{ $set: update },
			{ new: true, runValidators: true }
		);
		if (!doc) return res.status(404).json({ error: 'Not found' });
		auditLog('bike_update', req.user.email, { bikeId: doc._id });
		res.json(doc);
	} catch (err) {
		res.status(500).json({ error: 'Server error' });
	}
});

// DELETE /bikes/:id - remove
router.delete('/:id', [param('id').isMongoId()], requireAuth, async (req, res) => {
	if (!handleValidation(req, res)) return;
	try {
		const doc = await Bike.findOneAndUpdate(
			{ _id: req.params.id, ownerEmail: req.user.email.toLowerCase(), deletedAt: { $exists: false } },
			{ $set: { deletedAt: new Date() } },
			{ new: true }
		);
		if (doc) auditLog('bike_soft_delete', req.user.email, { bikeId: req.params.id });
		res.json({ ok: true, softDeleted: !!doc });
	} catch (err) {
		res.status(500).json({ error: 'Server error' });
	}
});

// POST /bikes/:id/restore - obnova soft-smazaného kola
router.post('/:id/restore', [param('id').isMongoId()], requireAuth, async (req, res) => {
	if (!handleValidation(req, res)) return;
	try {
		const doc = await Bike.findOneAndUpdate(
			{ _id: req.params.id, ownerEmail: req.user.email.toLowerCase(), deletedAt: { $exists: true } },
			{ $unset: { deletedAt: 1 } },
			{ new: true }
		);
		if (!doc) return res.status(404).json({ error: 'Not found or not deleted' });
		auditLog('bike_restore', req.user.email, { bikeId: doc._id });
		res.json(doc);
	} catch (err) {
		res.status(500).json({ error: 'Server error' });
	}
});

// DELETE /bikes/:id/hard - admin trvalé smazání
router.delete('/:id/hard', [param('id').isMongoId()], requireAuth, async (req, res) => {
	try {
		if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
		const doc = await Bike.findOneAndDelete({ _id: req.params.id });
		if (!doc) return res.status(404).json({ error: 'Not found' });
		auditLog('bike_hard_delete', req.user.email, { bikeId: req.params.id });
		res.json({ ok: true, hardDeleted: true });
	} catch (err) {
		res.status(500).json({ error: 'Server error' });
	}
});

// POST /bikes/:id/image - upload / výměna obrázku (multipart)
router.post('/:id/image', [param('id').isMongoId()], requireAuth, upload.single('image'), async (req, res) => {
	if (!req.file) return res.status(400).json({ error: 'Chybí soubor image' });
	try {
		const ext = req.file.mimetype === 'image/png' ? '.png'
			: (req.file.mimetype === 'image/webp' ? '.webp' : '.jpg');
		const filename = `${req.params.id}_${Date.now()}${ext}`;
		const fullPath = path.join(uploadDir, filename);
		await fs.promises.writeFile(fullPath, req.file.buffer);
		const relative = `/uploads/bikes/${filename}`;
		// Najdi starý obrázek kvůli úklidu
		const current = await Bike.findOne({ _id: req.params.id, ownerEmail: req.user.email.toLowerCase() });
		if (!current) return res.status(404).json({ error: 'Not found' });
		const oldImage = current.imageUrl && current.imageUrl.startsWith('/uploads/bikes/') ? current.imageUrl : null;
		current.imageUrl = relative;
		await current.save();
		if (oldImage) {
			try { await fs.promises.unlink(path.join(uploadDir, path.basename(oldImage))); } catch (_) {}
		}
		return res.json(current);
	} catch (err) {
		return res.status(500).json({ error: 'Server error' });
	}
});

module.exports = router;

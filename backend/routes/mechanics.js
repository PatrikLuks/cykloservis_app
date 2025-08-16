const express = require('express');
const router = express.Router();
const { query, param, body, validationResult } = require('express-validator');
const MechanicProfile = require('../models/MechanicProfile');
const { sendMail } = require('../utils/mailer');
const ServiceRequest = require('../models/ServiceRequest');
const Bike = require('../models/Bike');
const { requireAuth } = require('../middleware/auth');
const User = require('../models/User');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const rateLimit = require('express-rate-limit');
const auditLog = require('../utils/auditLog');

const SERVICE_TYPES = ['servis','reklamace','odpruzeni'];

// Avatar upload setup (lightweight, similar to bikes but separate folder)
const mechUploadDir = process.env.MECHANICS_UPLOAD_DIR || path.join(process.cwd(), 'uploads', 'mechanics');
if (!fs.existsSync(mechUploadDir)) fs.mkdirSync(mechUploadDir, { recursive: true });
const avatarStorage = multer.memoryStorage();
const avatarUpload = multer({
	storage: avatarStorage,
	// Allow up to ~1.5 MB
	limits: { fileSize: 1_500_000 },
	fileFilter: (req, file, cb) => {
		if (!['image/png','image/jpeg','image/jpg','image/webp'].includes(file.mimetype)) {
			const err = new Error('unsupported-file-type');
			err.code = 'UNSUPPORTED_TYPE';
			return cb(err);
		}
		cb(null, true);
	}
});

function validate(req, res) {
	const errors = validationResult(req);
	if (!errors.isEmpty()) { res.status(400).json({ errors: errors.array() }); return false; }
	return true;
}

// List mechanics (optional filter by skills)
router.get('/', requireAuth, [
	query('skills').optional().isString()
], async (req, res) => {
	if (!validate(req, res)) return;
	try {
		const { skills } = req.query;
		const filter = { active: true };
		if (skills) {
			const list = skills.split(',').map(s => s.trim()).filter(Boolean);
			if (list.length) filter.skills = { $all: list };
		}
			const mechanics = await MechanicProfile.find(filter)
				.select('skills userId availableSlots active avatarUrl')
				.populate('userId', 'firstName lastName email address')
				.lean();
			// Add displayName for convenience
			const enriched = mechanics.map(m => ({
				...m,
				displayName: m.userId ? ((m.userId.firstName || '') + ' ' + (m.userId.lastName || '')).trim() || m.userId.email : '—',
				address: m.userId?.address || '',
				avatarUrl: m.avatarUrl || ''
			}));
			res.json(enriched);
	} catch (e) {
		res.status(500).json({ error: 'Server error' });
	}
});

// Availability for mechanic (returns future slots with occupancy flag)
router.get('/:id/availability', requireAuth, [
	param('id').isMongoId()
], async (req, res) => {
	if (!validate(req, res)) return;
	try {
			const mech = await MechanicProfile.findOne({ _id: req.params.id, active: true })
				.populate('userId', 'firstName lastName email')
				.lean();
		if (!mech) return res.status(404).json({ error: 'Mechanik nenalezen' });
		const now = new Date();
		const futureSlots = (mech.availableSlots || []).filter(d => d >= now);
		const requests = await ServiceRequest.find({ mechanicId: mech._id, assignedDate: { $gte: now } })
			.select('assignedDate')
			.lean();
		const occupiedSet = new Set(requests.map(r => new Date(r.assignedDate).toISOString()));
		const slots = futureSlots
			.sort((a,b)=> a-b)
			.map(s => ({ slot: s, occupied: occupiedSet.has(new Date(s).toISOString()) }));
		res.json({ mechanicId: mech._id, slots });
	} catch (e) {
		res.status(500).json({ error: 'Server error' });
	}
});

// --- Self-service mechanic panel endpoints ---

// Get allowed service types
router.get('/service-types/list', requireAuth, (req, res) => {
	res.json({ types: SERVICE_TYPES });
});

// Upgrade current user to mechanic (idempotent)
const upgradeLimiter = rateLimit({ windowMs: 15*60*1000, max: 10, standardHeaders:true, legacyHeaders:false });
router.post('/self/upgrade', requireAuth, upgradeLimiter, async (req, res) => {
	try {
		const user = await User.findById(req.user.id);
		if (!user) return res.status(404).json({ error: 'User not found' });
		if (user.role !== 'mechanic') {
			user.role = 'mechanic';
			await user.save();
	auditLog('mechanic_upgrade', req.user.email, { userId: user._id });
		}
		// Ensure a mechanic profile exists
		let profile = await MechanicProfile.findOne({ userId: user._id });
		if (!profile) {
			profile = await MechanicProfile.create({ userId: user._id, skills: [], active: false });
		}
		res.json({ ok: true, role: user.role, profile });
	} catch (e) {
		res.status(500).json({ error: 'Server error' });
	}
});

// Get own mechanic profile
router.get('/self', requireAuth, async (req, res) => {
	try {
		const profile = await MechanicProfile.findOne({ userId: req.user.id });
		if (!profile) return res.status(404).json({ error: 'Profile not found' });
		res.json(profile);
	} catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// Update own mechanic profile
const selfUpdateLimiter = rateLimit({ windowMs: 10*60*1000, max: 60, standardHeaders:true, legacyHeaders:false });
router.put('/self', requireAuth, selfUpdateLimiter, [
	body('skills').optional().isArray(),
	body('skills.*').optional().isIn(SERVICE_TYPES),
	body('availableSlots').optional().isArray(),
	body('availableSlots.*').optional().isISO8601(),
	body('note').optional().isString(),
	body('active').optional().isBoolean(),
	body('avatarUrl').optional().isString(),
	body('firstName').optional().isString(),
	body('lastName').optional().isString(),
	body('phoneCountryCode').optional().isString(),
	body('phoneNumber').optional().isString(),
	body('address').optional().isString(),
	body('email').optional().isEmail()
], async (req, res) => {
	if (!validate(req, res)) return;
	try {
		let profile = await MechanicProfile.findOne({ userId: req.user.id });
		if (!profile) return res.status(404).json({ error: 'Profile not found' });
		const { skills, availableSlots, note, active, avatarUrl, firstName, lastName, phoneCountryCode, phoneNumber, address } = req.body; // email změnu nepovolujeme nyní
		if (skills) profile.skills = skills;
		if (availableSlots) profile.availableSlots = availableSlots.map(d => new Date(d));
		if (note !== undefined) profile.note = note;
		if (active !== undefined) profile.active = active;
		if (avatarUrl !== undefined) profile.avatarUrl = avatarUrl;
		// Update linked user basic info (except email unless explicitly allowed)
		const user = await User.findById(req.user.id);
		if (user) {
			if (firstName !== undefined) user.firstName = firstName;
			if (lastName !== undefined) user.lastName = lastName;
			if (phoneCountryCode !== undefined) user.phoneCountryCode = phoneCountryCode;
			if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;
			if (address !== undefined) user.location = address; // reuse existing location field
			// Email change disabled until verification flow implemented
			await user.save();
		}
		await profile.save();
		res.json({
			profile,
			user: user ? {
				firstName: user.firstName,
				lastName: user.lastName,
				email: user.email,
				phoneCountryCode: user.phoneCountryCode,
				phoneNumber: user.phoneNumber,
				address: user.location
			} : null
		});
	} catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// Append a single slot (helper) - optional sugar
router.post('/self/slots', requireAuth, [
	body('slot').isISO8601()
], async (req, res) => {
	if (!validate(req, res)) return;
	try {
		let profile = await MechanicProfile.findOne({ userId: req.user.id });
		if (!profile) return res.status(404).json({ error: 'Profile not found' });
		const date = new Date(req.body.slot);
		if (!profile.availableSlots.find(s => s.getTime() === date.getTime())) {
			profile.availableSlots.push(date);
			await profile.save();
		}
		res.json(profile);
	} catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// Remove a slot (exact ISO match)
router.delete('/self/slots', requireAuth, [body('slot').isISO8601()], async (req, res) => {
	if (!validate(req, res)) return;
	try {
		const profile = await MechanicProfile.findOne({ userId: req.user.id });
		if (!profile) return res.status(404).json({ error: 'Profile not found' });
		const target = new Date(req.body.slot).getTime();
		profile.availableSlots = (profile.availableSlots || []).filter(s => new Date(s).getTime() !== target);
		await profile.save();
		res.json(profile);
	} catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// List service requests assigned to current mechanic (their "jobs")
router.get('/self/requests', requireAuth, async (req, res) => {
	try {
		const profile = await MechanicProfile.findOne({ userId: req.user.id });
		if (!profile) return res.status(404).json({ error: 'Profile not found' });
		const requests = await ServiceRequest.find({ mechanicId: profile._id }).sort({ createdAt: -1 }).lean();
		res.json({ mechanicId: profile._id, requests });
	} catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// Get single request detail (with bike info)
router.get('/self/requests/:id', requireAuth, [param('id').isMongoId()], async (req, res) => {
	if (!validate(req, res)) return;
	try {
		const profile = await MechanicProfile.findOne({ userId: req.user.id });
		if (!profile) return res.status(404).json({ error: 'Profile not found' });
		const reqDoc = await ServiceRequest.findOne({ _id: req.params.id, mechanicId: profile._id }).lean();
		if (!reqDoc) return res.status(404).json({ error: 'Request not found' });
		let bike = null;
		if (reqDoc.bikeId) {
			try { bike = await Bike.findById(reqDoc.bikeId).lean(); } catch {}
		}
		res.json({ ...reqDoc, bike });
	} catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// Update status of a request (mechanic side)
router.put('/self/requests/:id/status', requireAuth, [
	param('id').isMongoId(),
	body('status').isIn(['new','in_progress','done','cancelled'])
], async (req, res) => {
	if (!validate(req, res)) return;
	try {
		const profile = await MechanicProfile.findOne({ userId: req.user.id });
		if (!profile) return res.status(404).json({ error: 'Profile not found' });
			const reqDoc = await ServiceRequest.findOne({ _id: req.params.id, mechanicId: profile._id });
			if (!reqDoc) return res.status(404).json({ error: 'Request not found' });
			const prev = reqDoc.status;
			reqDoc.status = req.body.status;
			reqDoc.events.push({ type: 'status_change', from: prev, to: reqDoc.status, by: req.user.email });
			await reqDoc.save();
			// Notify owner via email (best effort)
			if (reqDoc.ownerEmail) {
				sendMail({
					to: reqDoc.ownerEmail,
					subject: `Aktualizace zakázky: ${reqDoc.title}`,
					html: `<p>Stav vaší zakázky byl změněn z <b>${prev}</b> na <b>${reqDoc.status}</b>.</p>`
				}).catch(()=>{});
			}
			res.json(reqDoc);
	} catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// List distinct clients (owners) for this mechanic's assigned requests + basic aggregates
router.get('/self/clients', requireAuth, async (req, res) => {
	try {
		const profile = await MechanicProfile.findOne({ userId: req.user.id });
		if (!profile) return res.status(404).json({ error: 'Profile not found' });
		const requests = await ServiceRequest.find({ mechanicId: profile._id }).sort({ createdAt: -1 }).lean();
		const byOwner = new Map();
		for (const r of requests) {
			if (!byOwner.has(r.ownerEmail)) byOwner.set(r.ownerEmail, []);
			byOwner.get(r.ownerEmail).push(r);
		}
		const clients = [];
		for (const [email, list] of byOwner.entries()) {
			const total = list.length;
			const open = list.filter(r => r.status !== 'done' && r.status !== 'cancelled').length;
			const last = list[0];
			let bikes = [];
			try { bikes = await Bike.find({ ownerEmail: email, deletedAt: { $exists: false } }).select('title _id').lean(); } catch {}
			clients.push({ email, totalRequests: total, openRequests: open, lastStatus: last.status, lastCreatedAt: last.createdAt, bikes });
		}
		clients.sort((a,b)=> new Date(b.lastCreatedAt) - new Date(a.lastCreatedAt));
		res.json({ mechanicId: profile._id, clients });
	} catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// Stats for dashboard
router.get('/self/stats', requireAuth, async (req, res) => {
	try {
		const profile = await MechanicProfile.findOne({ userId: req.user.id });
		if (!profile) return res.status(404).json({ error: 'Profile not found' });
		const now = new Date();
		const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
		const startOfWeek = new Date(startOfDay); // simple 7-day window
		startOfWeek.setDate(startOfDay.getDate() - 6);
		const all = await ServiceRequest.find({ mechanicId: profile._id }).select('status createdAt').lean();
		const today = all.filter(r => new Date(r.createdAt) >= startOfDay).length;
		const week = all.filter(r => new Date(r.createdAt) >= startOfWeek).length;
		const open = all.filter(r => r.status !== 'done' && r.status !== 'cancelled').length;
		res.json({ today, week, open, total: all.length });
	} catch (e) { res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;

// Avatar upload endpoint (placed before export earlier logically, ensure order doesn't matter)
router.post('/self/avatar', requireAuth, (req, res, next) => {
	avatarUpload.single('avatar')(req, res, function(err){
		if (err) {
			if (err.code === 'LIMIT_FILE_SIZE') {
				return res.status(413).json({ error: 'Soubor je příliš velký. Max 1.5 MB.' });
			}
			if (err.code === 'UNSUPPORTED_TYPE') {
				return res.status(400).json({ error: 'Nepodporovaný formát. Povolené: JPG, PNG, WEBP.' });
			}
			return res.status(400).json({ error: 'Upload selhal' });
		}
		next();
	});
}, async (req, res) => {
	try {
		if (!req.file) return res.status(400).json({ error: 'Soubor chybí' });
		const ext = req.file.mimetype.split('/')[1] || 'png';
		const fileName = req.user.id + '_' + Date.now() + '.' + ext;
		const fullPath = path.join(mechUploadDir, fileName);
	await fs.promises.writeFile(fullPath, req.file.buffer);
		let profile = await MechanicProfile.findOne({ userId: req.user.id });
		if (!profile) return res.status(404).json({ error: 'Profile not found' });
		profile.avatarUrl = '/uploads/mechanics/' + fileName;
		await profile.save();
		res.json({ avatarUrl: profile.avatarUrl });
	} catch (e) {
		res.status(500).json({ error: 'Server error' });
	}
});



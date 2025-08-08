const express = require('express');
const router = express.Router();
const { body, validationResult, query, param } = require('express-validator');
const Bike = require('../models/Bike');
const { requireAuth } = require('../middleware/auth');

function handleValidation(req, res) {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		res.status(400).json({ errors: errors.array() });
		return false;
	}
	return true;
}

// GET /bikes - list
router.get('/', requireAuth, async (req, res) => {
	try {
		const query = { ownerEmail: req.user.email };
		const items = await Bike.find(query).sort({ createdAt: -1 });
		res.json(items);
	} catch (err) {
		res.status(500).json({ error: 'Server error' });
	}
});

// POST /bikes - create
router.post('/',
	[
		body('title').notEmpty().withMessage('title is required'),
		body('model').optional().isString(),
		body('year').optional().isInt({ min: 1900, max: 2100 }),
		body('minutesRidden').optional().isInt({ min: 0 }),
		body('imageUrl').optional().isString(),
		body('ownerEmail').optional().isEmail()
	],
	requireAuth,
	async (req, res) => {
		if (!handleValidation(req, res)) return;
		try {
			const payload = { ...req.body };
			payload.ownerEmail = req.user.email;
			const bike = await Bike.create(payload);
			res.status(201).json(bike);
		} catch (err) {
			res.status(500).json({ error: 'Server error' });
		}
	}
);

// DELETE /bikes/:id - remove
router.delete('/:id', [param('id').isMongoId()], requireAuth, async (req, res) => {
	if (!handleValidation(req, res)) return;
	try {
		await Bike.findOneAndDelete({ _id: req.params.id, ownerEmail: req.user.email });
		res.json({ ok: true });
	} catch (err) {
		res.status(500).json({ error: 'Server error' });
	}
});

module.exports = router;

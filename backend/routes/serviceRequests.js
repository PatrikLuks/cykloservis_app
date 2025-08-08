const express = require('express');
const router = express.Router();
const { body, param, validationResult } = require('express-validator');
const { requireAuth } = require('../middleware/auth');
const ServiceRequest = require('../models/ServiceRequest');

function validate(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return false;
  }
  return true;
}

// List my requests
router.get('/', requireAuth, async (req, res) => {
  try {
    const items = await ServiceRequest.find({ ownerEmail: req.user.email }).sort({ createdAt: -1 });
    res.json(items);
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create
router.post('/',
  requireAuth,
  [
    body('bikeId').isMongoId(),
    body('title').notEmpty(),
    body('description').optional().isString(),
    body('preferredDate').optional().isISO8601(),
    body('priceEstimate').optional().isFloat({ min: 0 })
  ],
  async (req, res) => {
    if (!validate(req, res)) return;
    try {
      const payload = { ...req.body, ownerEmail: req.user.email };
      const created = await ServiceRequest.create(payload);
      res.status(201).json(created);
    } catch (e) {
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// Update status
router.put('/:id/status', requireAuth, [
  param('id').isMongoId(),
  body('status').isIn(['new','in_progress','done','cancelled'])
], async (req, res) => {
  if (!validate(req, res)) return;
  try {
    const updated = await ServiceRequest.findOneAndUpdate(
      { _id: req.params.id, ownerEmail: req.user.email },
      { status: req.body.status },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: 'Not found' });
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete
router.delete('/:id', requireAuth, [param('id').isMongoId()], async (req, res) => {
  if (!validate(req, res)) return;
  try {
    await ServiceRequest.findOneAndDelete({ _id: req.params.id, ownerEmail: req.user.email });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

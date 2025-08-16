const express = require('express');
const router = express.Router();
const { body, param, validationResult } = require('express-validator');
const { requireAuth } = require('../middleware/auth');
const ServiceRequest = require('../models/ServiceRequest');
const MechanicProfile = require('../models/MechanicProfile');

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
    body('title').notEmpty(),
    body('bikeId').optional().isMongoId(),
    body('mechanicId').optional().isMongoId(),
    body('serviceTypes').optional().isArray(),
    body('serviceTypes.*').optional().isIn(['servis','reklamace','odpruzeni']),
    body('deferredBike').optional().isBoolean(),
    body('preferredDate').optional().isISO8601(),
    body('firstAvailable').optional().isBoolean(),
    body('description').optional().isString(),
  body('priceEstimate').optional().isFloat({ min: 0 })
  ],
  async (req, res) => {
    if (!validate(req, res)) return;
    try {
  const { mechanicId, preferredDate, firstAvailable, serviceTypes } = req.body;
      const payload = { ...req.body, ownerEmail: req.user.email };

      // Validate mechanic & skills vs serviceTypes if provided
      let mechanicDoc = null;
      if (mechanicId) {
        mechanicDoc = await MechanicProfile.findOne({ _id: mechanicId, active: true });
        if (!mechanicDoc) return res.status(400).json({ error: 'Neplatný nebo neaktivní mechanik' });
        if (serviceTypes && serviceTypes.length) {
          const missing = serviceTypes.filter(st => !mechanicDoc.skills.includes(st));
          if (missing.length) return res.status(400).json({ error: 'Mechanik nepokrývá požadované typy', missing });
        }
      }

      // Assign slot logic
      let assignedDate = null;
      if (mechanicDoc) {
        const now = new Date();
        // Load existing bookings for mechanic upcoming
        const futureRequests = await ServiceRequest.find({ mechanicId, assignedDate: { $gte: now } }, { assignedDate: 1, _id: 0 }).lean();
        const occupied = new Set(futureRequests.map(r => new Date(r.assignedDate).toISOString()));
        const sortedSlots = (mechanicDoc.availableSlots || [])
          .filter(d => d >= now)
          .sort((a,b)=> a - b);

        if (preferredDate) {
          const pref = new Date(preferredDate);
            // exact match needed
          const match = sortedSlots.find(s => s.getTime() === pref.getTime());
          if (!match) return res.status(400).json({ error: 'Preferovaný termín není v dostupných slotech' });
          if (occupied.has(pref.toISOString())) return res.status(400).json({ error: 'Preferovaný termín je již obsazen' });
          assignedDate = pref;
        } else if (firstAvailable) {
          const firstFree = sortedSlots.find(s => !occupied.has(s.toISOString()));
          if (!firstFree) return res.status(400).json({ error: 'Žádný volný termín' });
          assignedDate = firstFree;
        }
      }

      if (assignedDate) payload.assignedDate = assignedDate;

      // Simple rough priceEstimate fallback if not provided
      if (payload.priceEstimate == null && serviceTypes && serviceTypes.length) {
        // naive pricing table
        const base = 300; // Kč
        const typeAdd = {
          servis: 200,
          reklamace: 0,
          odpruzeni: 500
        };
        payload.priceEstimate = serviceTypes.reduce((sum, t) => sum + (typeAdd[t] || 0), base);
      }

      // Conditional bikeId requirement
      if (!payload.deferredBike && !payload.bikeId) {
        return res.status(400).json({ error: 'bikeId je povinné pokud není deferredBike=true' });
      }

  if (!payload.events) payload.events = [];
  payload.events.push({ type: 'created', to: 'new', by: req.user.email });
  const created = await ServiceRequest.create(payload);
      res.status(201).json(created);
    } catch (e) {
      console.error(e);
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
  const reqDoc = await ServiceRequest.findOne({ _id: req.params.id, ownerEmail: req.user.email });
  if (!reqDoc) return res.status(404).json({ message: 'Not found' });
  const prev = reqDoc.status;
  reqDoc.status = req.body.status;
  reqDoc.events.push({ type: 'status_change', from: prev, to: reqDoc.status, by: req.user.email });
  await reqDoc.save();
  const updated = reqDoc;
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

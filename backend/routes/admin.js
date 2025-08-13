const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');
const { body, param, validationResult } = require('express-validator');
const auditLog = require('../utils/auditLog');

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
}

function handleValidation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return false;
  }
  return true;
}

// GET /admin/users - list uživatelů (základní přehled)
router.get('/users', requireAuth, requireAdmin, async (req, res) => {
  try {
    const users = await User.find({}, { email: 1, role: 1, isVerified: 1, createdAt: 1 })
      .sort({ createdAt: -1 })
      .lean();
    auditLog('admin_list_users', req.user.email, { count: users.length });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Chyba serveru' });
  }
});

// POST /admin/users/:id/role - změna role
router.post(
  '/users/:id/role',
  requireAuth,
  requireAdmin,
  [param('id').isMongoId(), body('role').isIn(['user', 'admin']).withMessage('Neplatná role')],
  async (req, res) => {
    if (!handleValidation(req, res)) return;
    try {
      if (String(req.user.id) === req.params.id && req.body.role !== 'admin') {
        return res.status(403).json({ error: 'Nelze degradovat sám sebe.' });
      }
      const user = await User.findByIdAndUpdate(
        req.params.id,
        { role: req.body.role },
        { new: true }
      );
      if (!user) return res.status(404).json({ error: 'Uživatel nenalezen' });
      auditLog('admin_change_role', req.user.email, { target: user.email, role: user.role });
      res.json({ email: user.email, role: user.role });
    } catch (err) {
      res.status(500).json({ error: 'Chyba serveru' });
    }
  }
);

// DELETE /admin/users - Smazání všech uživatelů (původní funkce, ponecháno, chráněno)
router.delete('/users', requireAuth, requireAdmin, async (req, res) => {
  try {
    const result = await User.deleteMany({});
    auditLog('admin_delete_all_users', req.user.email, { deleted: result.deletedCount });
    res.json({ message: 'Všichni uživatelé byli odstraněni.' });
  } catch (err) {
    res.status(500).json({ error: 'Chyba serveru' });
  }
});

module.exports = router;

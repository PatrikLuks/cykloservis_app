const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Optional auth: if Authorization: Bearer <token> is present and valid,
// attaches req.user; otherwise continues without failing.
async function authOptional(req, res, next) {
  try {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) return next();
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(decoded.id).lean();
  if (user) req.user = { id: String(user._id), email: user.email, role: user.role || 'user' };
  } catch (e) {
    // ignore invalid tokens in optional flow
  } finally {
    next();
  }
}

// Strict auth: requires a valid token, else 401.
async function requireAuth(req, res, next) {
  try {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ message: 'Unauthorized' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(decoded.id).lean();
  if (!user) return res.status(401).json({ message: 'Unauthorized' });
  req.user = { id: String(user._id), email: user.email, role: user.role || 'user' };
    next();
  } catch (e) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
}

module.exports = { authOptional, requireAuth };

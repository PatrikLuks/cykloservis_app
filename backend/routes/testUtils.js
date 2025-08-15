// Test utilities – nejsou určeny pro produkci.
const express = require('express');
const router = express.Router();
const User = require('../models/User');

router.get('/user', async (req, res) => {
  if (process.env.ENABLE_TEST_UTILS !== '1') {
    return res.status(403).json({ error: 'Disabled' });
  }
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: 'email required' });
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ error: 'not found' });
  res.json({
    email: user.email,
    verificationCode: user.verificationCode,
    isVerified: user.isVerified,
  });
});

module.exports = router;

const express = require('express');
const router = express.Router();
const User = require('../models/User');

// DELETE /api/admin/users - smaže všechny uživatele
router.delete('/users', async (req, res) => {
  try {
    await User.deleteMany({});
    res.json({ message: 'Všichni uživatelé byli odstraněni.' });
  } catch (err) {
    res.status(500).json({ error: 'Chyba serveru' });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { requireAuth } = require('../middleware/auth');

const logFile = path.join(__dirname, '../audit.log');

// Simple in-memory cache TTL 5s to avoid heavy disk reading
let cache = { ts: 0, data: [] };

router.get('/', requireAuth, async (req, res) => {
  try {
    const now = Date.now();
    if (now - cache.ts > 5000) {
      // read last 500 lines only for performance
      const raw = await fs.promises.readFile(logFile, 'utf8').catch(()=> '');
      const lines = raw.trim().split('\n').filter(Boolean);
      const sliced = lines.slice(-500);
      cache = { ts: now, data: sliced.map(l=> { try { return JSON.parse(l); } catch { return null; }}).filter(Boolean) };
    }
    // Filter for current user + relevant bike actions
    const relevant = cache.data.filter(e => e.userEmail === req.user.email && ['bike_create','bike_soft_delete','bike_restore','bike_hard_delete'].includes(e.action));
    // Map to display format
  const rawLimit = parseInt(req.query.limit, 10);
  const limit = (!isNaN(rawLimit) && rawLimit > 0 && rawLimit <= 50) ? rawLimit : 25;
  const items = relevant.sort((a,b)=> new Date(b.timestamp)-new Date(a.timestamp)).slice(0, limit).map(e => ({
      id: e.details && e.details.bikeId || e.timestamp,
      action: e.action,
      date: e.timestamp,
      details: e.details || {}
    }));
    res.json(items);
  } catch (e) {
    res.status(500).json({ error: 'Nelze načíst aktivitu' });
  }
});

module.exports = router;

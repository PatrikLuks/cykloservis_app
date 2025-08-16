// Middleware to restrict req.body to an allowed list of top-level keys.
// Unknown keys are removed. Optionally logs stripped keys via provided logger.
module.exports = function bodyWhitelist(allowed, { logFn } = {}) {
  const allowedSet = new Set(allowed);
  return function (req, res, next) {
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) return next();
    const keys = Object.keys(req.body);
    const removed = [];
    for (const k of keys) {
      if (!allowedSet.has(k)) {
        removed.push(k);
        delete req.body[k];
      }
    }
    if (removed.length && typeof logFn === 'function') {
      try { logFn(removed, allowed, req); } catch(_) {}
    }
    next();
  };
};

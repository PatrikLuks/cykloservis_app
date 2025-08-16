const fs = require('fs');
const path = require('path');

const logFile = path.join(__dirname, '../audit.log');
const logger = require('./logger');
const MAX_SIZE_BYTES = parseInt(process.env.AUDIT_MAX_SIZE || '', 10) || 5 * 1024 * 1024; // 5MB default

function rotateIfNeeded() {
  try {
    const stats = fs.existsSync(logFile) ? fs.statSync(logFile) : null;
    if (stats && stats.size >= MAX_SIZE_BYTES) {
      const ts = new Date().toISOString().replace(/[:.]/g,'-');
      const rotated = logFile + '.' + ts + '.1';
      fs.renameSync(logFile, rotated);
      logger.info('Audit log rotated', { rotated });
    }
  } catch (e) {
    logger.error('Audit rotation failed', { error: e.message });
  }
}

function auditLog(action, userEmail, details = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    action,
    userEmail,
    details
  };
  rotateIfNeeded();
  fs.appendFile(logFile, JSON.stringify(entry) + '\n', err => {
    if (err) logger.error('Audit log write fail', { error: err.message });
  });
}

module.exports = auditLog;

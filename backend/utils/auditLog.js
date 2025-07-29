const fs = require('fs');
const path = require('path');

const logFile = path.join(__dirname, '../audit.log');

function auditLog(action, userEmail, details = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    action,
    userEmail,
    details
  };
  fs.appendFile(logFile, JSON.stringify(entry) + '\n', err => {
    if (err) console.error('Audit log error:', err);
  });
}

module.exports = auditLog;

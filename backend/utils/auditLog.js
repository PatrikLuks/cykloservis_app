const fs = require('fs');
const path = require('path');

const baseFile = path.join(__dirname, '../audit.log');
function getMaxBytes() {
  return Number(process.env.AUDIT_LOG_MAX_BYTES || 200_000);
}
function getMaxFiles() {
  return Number(process.env.AUDIT_LOG_MAX_FILES || 3);
}

function rotateIfNeeded() {
  try {
    const st = fs.statSync(baseFile);
    const maxBytes = getMaxBytes();
    if (st.size < maxBytes) return; // není třeba rotovat
  } catch (e) {
    return; // soubor neexistuje
  }
  try {
    const maxFiles = getMaxFiles();
    // Příklad: maxFiles=3 => chceme audit.log(.current), audit.log.1, audit.log.2, audit.log.3
    // Shift:  audit.log.2 -> audit.log.3, audit.log.1 -> audit.log.2, audit.log -> audit.log.1
    for (let i = maxFiles - 1; i >= 1; i--) {
      const src = `${baseFile}.${i}`;
      if (fs.existsSync(src)) {
        const dst = `${baseFile}.${i + 1}`;
        fs.renameSync(src, dst);
      }
    }
    // Nakonec přejmenuj current na .1
    fs.renameSync(baseFile, `${baseFile}.1`);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Audit log rotate error:', err);
  }
}

function auditLog(action, userEmail, details = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    action,
    userEmail,
    details,
  };
  try {
    rotateIfNeeded();
  } catch (_) {
    /* ignore rotate error */
  }
  try {
    fs.appendFileSync(baseFile, JSON.stringify(entry) + '\n');
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Audit log error:', err);
  }
}

module.exports = auditLog;
module.exports._rotateIfNeeded = rotateIfNeeded;
module.exports._baseFile = baseFile;
module.exports._getMaxBytes = getMaxBytes;
module.exports._getMaxFiles = getMaxFiles;

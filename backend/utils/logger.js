const levels = ['error','warn','info','debug'];
const level = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');
const idx = levels.indexOf(level) === -1 ? 2 : levels.indexOf(level);

function fmt(msg, meta){
  const ts = new Date().toISOString();
  let line = `[${ts}] ${msg}`;
  if (meta && Object.keys(meta).length) {
    try { line += ' ' + JSON.stringify(meta); } catch { /* ignore */ }
  }
  return line;
}

exports.info = (msg, meta={}) => { if (idx >= 2) process.stdout.write(fmt(msg, meta) + '\n'); };
exports.warn = (msg, meta={}) => { if (idx >= 1) process.stdout.write(fmt('WARN '+msg, meta) + '\n'); };
exports.error = (msg, meta={}) => { process.stderr.write(fmt('ERR '+msg, meta) + '\n'); };
exports.debug = (msg, meta={}) => { if (idx >= 3) process.stdout.write(fmt('DBG '+msg, meta) + '\n'); };

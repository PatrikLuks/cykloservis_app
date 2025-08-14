module.exports = function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);
  // Multer limit -> 413
  if (err && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'Soubor příliš velký', code: 'PAYLOAD_TOO_LARGE' });
  }
  const status = err.status || 500;
  if (status === 404 && err.message) {
    return res.status(404).json({ message: err.message || 'Not found' });
  }
  if (status === 500 && process.env.NODE_ENV === 'test') {
    // eslint-disable-next-line no-console
    console.error('[TEST ERROR]', (err && err.stack) || err);
  }
  res.status(status).json({
    error: err.error || err.message || 'Server error',
    code: err.code || (status === 500 ? 'SERVER_ERROR' : undefined),
  });
};

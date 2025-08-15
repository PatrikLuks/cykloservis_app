// Global setup for Jest test environment
module.exports = async () => {
  // Ensure we don't auto-connect in index.js; individual tests manage their own test DB connection
  process.env.SKIP_DB = process.env.SKIP_DB || '1';
  process.env.NODE_ENV = process.env.NODE_ENV || 'test';
  if (!process.env.JWT_SECRET) process.env.JWT_SECRET = 'test-secret';
  // Load .env once (tests sometimes call require('dotenv').config() themselves; that's ok)
  try {
    require('dotenv').config();
  } catch (e) {
    /* ignore dotenv */
  }
};

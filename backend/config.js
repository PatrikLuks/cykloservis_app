// Centralizovaná konfigurace
const toInt = (v, d) => {
  const n = parseInt(v, 10);
  return Number.isNaN(n) ? d : n;
};

module.exports = {
  port: toInt(process.env.PORT, 5001),
  rateLimit: {
    windowMs: toInt(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
    max: toInt(process.env.RATE_LIMIT_MAX, 100),
    sensitiveMax: toInt(process.env.RATE_LIMIT_SENSITIVE_MAX, 20),
    disabledForE2E: process.env.PLAYWRIGHT_E2E === '1',
  },
  createBikeRateLimit: {
    windowMs: toInt(process.env.CREATE_BIKE_WINDOW_MS, 15 * 60 * 1000),
    max: toInt(process.env.CREATE_BIKE_RATE_MAX, 30),
  },
};

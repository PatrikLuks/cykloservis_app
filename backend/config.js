// Centralizovaná konfigurace
module.exports = {
  port: parseInt(process.env.PORT || '5001', 10),
  rateLimit: {
    windowMs: 60_000,
    max: 100,
    disabledForE2E: process.env.PLAYWRIGHT_E2E === '1',
  },
};

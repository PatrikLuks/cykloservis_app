// Root Jest config to ensure only backend tests are executed (frontend uses Vitest)
module.exports = {
  projects: ['<rootDir>/backend'],
};

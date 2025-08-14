const contractOnly = process.env.CONTRACT_ONLY === '1';

module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/jest.setup.js'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  ...(contractOnly
    ? {}
    : {
        coverageThreshold: {
          global: {
            lines: 72,
            functions: 72,
            statements: 72,
            branches: 59,
          },
        },
      }),
  globalTeardown: '<rootDir>/tests/globalTeardown.js',
  globalSetup: '<rootDir>/tests/globalSetup.js',
};

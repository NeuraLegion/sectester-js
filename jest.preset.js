const nxPreset = require('@nrwl/jest/preset').default;

module.exports = {
  ...nxPreset,
  coverageReporters: ['html', 'json', 'lcov'],
  collectCoverageFrom: [
    '**/*.{ts,tsx}',
    '!**/node_modules/**',
    '!**/index.ts',
    '!**/register.ts'
  ]
};

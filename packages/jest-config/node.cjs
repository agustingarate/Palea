/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  rootDir: process.cwd(),
  testEnvironment: 'node',
  clearMocks: true,
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts'],
};

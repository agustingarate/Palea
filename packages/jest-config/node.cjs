/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  rootDir: process.cwd(),
  testEnvironment: 'node',
  clearMocks: true,
  transform: {
    '^.+\\.[tj]s$': [
      'ts-jest',
      { tsconfig: { allowJs: true, rootDir: process.cwd() } },
    ],
  },
  transformIgnorePatterns: ['/node_modules/.pnpm/(?!(dinero\\.js)@)'],
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts'],
};

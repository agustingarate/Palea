module.exports = {
  preset: 'jest-expo',
  clearMocks: true,
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  // pnpm resolves React Native through node_modules/.pnpm. Transforming dependencies
  // keeps Jest compatible with React Native's ESM setup files on Windows as well.
  transformIgnorePatterns: [],
};

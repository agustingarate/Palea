module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  testRegex: '.*\\.(spec|test)\\.ts$',
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.[tj]s$': [
      'ts-jest',
      { tsconfig: { allowJs: true, rootDir: process.cwd() } },
    ],
  },
  transformIgnorePatterns: [
    '/node_modules/.pnpm/(?!(htmlparser2|domelementtype|domhandler|domutils|dom-serializer|entities)@)',
  ],
  setupFiles: ['<rootDir>/test/environment.setup.ts'],
  clearMocks: true,
};

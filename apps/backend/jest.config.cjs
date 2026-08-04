module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  testRegex: '.*\\.(spec|test)\\.ts$',
  moduleFileExtensions: ['ts', 'js', 'json'],
  clearMocks: true,
};

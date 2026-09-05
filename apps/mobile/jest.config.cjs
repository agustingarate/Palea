module.exports = {
  preset: 'jest-expo',
  clearMocks: true,
  // Expo's native test preset retains a process handle after all assertions
  // complete. CI must report the completed suite rather than wait indefinitely.
  forceExit: true,
  setupFiles: ['<rootDir>/test/environment.setup.cjs'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^lucide-react-native$': '<rootDir>/test/lucide-react-native.cjs',
    '^react-native-reanimated$': '<rootDir>/test/react-native-reanimated.cjs',
  },
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  // pnpm resolves React Native through node_modules/.pnpm. Transforming dependencies
  // keeps Jest compatible with React Native's ESM setup files on Windows as well.
  transformIgnorePatterns: [],
};

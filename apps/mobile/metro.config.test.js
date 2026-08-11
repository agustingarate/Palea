import path from 'node:path';
import config from './metro.config.mjs';

jest.mock('expo/metro-config', () => ({
  getDefaultConfig: () => ({ resolver: {} }),
}));

jest.mock('nativewind/metro', () => ({
  withNativeWind: (config) => config,
}));

describe('mobile Metro development resolution', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    jest.resetModules();
    process.env.NODE_ENV = 'development';
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('uses the UI component source entry', () => {
    const fallback = jest.fn();
    const context = { resolveRequest: fallback };

    expect(
      config.resolver.resolveRequest(context, '@palea/ui-native', 'web'),
    ).toEqual({
      filePath: path.resolve(
        __dirname,
        '../../packages/ui-native/src/index.ts',
      ),
      type: 'sourceFile',
    });
    expect(fallback).not.toHaveBeenCalled();
  });
});

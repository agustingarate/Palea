import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

function resolveDevelopmentModule(moduleName) {
  const url = pathToFileURL(path.resolve(__dirname, 'metro.config.mjs')).href;
  const script = `process.env.NODE_ENV = 'development'; const { default: config } = await import(${JSON.stringify(url)}); const result = config.resolver.resolveRequest({ resolveRequest: () => null }, ${JSON.stringify(moduleName)}, 'web'); console.log(JSON.stringify(result));`;
  return JSON.parse(
    execFileSync(process.execPath, ['--input-type=module', '--eval', script], {
      encoding: 'utf8',
    }),
  );
}

function resolveConfig() {
  const url = pathToFileURL(path.resolve(__dirname, 'metro.config.mjs')).href;
  const script = `process.env.NODE_ENV = 'development'; const { createRequire } = await import('node:module'); const require = createRequire(import.meta.url); const { getDefaultConfig } = require('expo/metro-config'); const { default: config } = await import(${JSON.stringify(url)}); const defaults = getDefaultConfig(${JSON.stringify(path.resolve(__dirname))}); console.log(JSON.stringify({ watchFolders: config.watchFolders, defaultWatchFolders: defaults.watchFolders, nodeModulesPaths: config.resolver.nodeModulesPaths }));`;
  return JSON.parse(
    execFileSync(process.execPath, ['--input-type=module', '--eval', script], {
      cwd: __dirname,
      encoding: 'utf8',
    }),
  );
}

function resolveQueryCore() {
  const url = pathToFileURL(path.resolve(__dirname, 'metro.config.mjs')).href;
  const script = `process.env.NODE_ENV = 'development'; const { default: config } = await import(${JSON.stringify(url)}); const result = config.resolver.resolveRequest({ resolveRequest: () => null }, '@tanstack/query-core', 'web'); console.log(JSON.stringify(result));`;
  return JSON.parse(
    execFileSync(process.execPath, ['--input-type=module', '--eval', script], {
      cwd: __dirname,
      encoding: 'utf8',
    }),
  );
}

describe('mobile Metro development resolution', () => {
  it('uses the UI component source entry', () => {
    expect(resolveDevelopmentModule('@palea/ui-native')).toEqual({
      filePath: path.resolve(
        __dirname,
        '../../packages/ui-native/src/index.ts',
      ),
      type: 'sourceFile',
    });
  });

  it('uses the localization source entry', () => {
    expect(resolveDevelopmentModule('@palea/localization')).toEqual({
      filePath: path.resolve(
        __dirname,
        '../../packages/localization/src/index.ts',
      ),
      type: 'sourceFile',
    });
  });

  it('uses the workspace roots to resolve pnpm dependencies', () => {
    const config = resolveConfig();
    expect(config.watchFolders).toEqual(
      expect.arrayContaining([
        ...config.defaultWatchFolders,
        path.resolve(__dirname, '../..'),
      ]),
    );
    expect(config.nodeModulesPaths).toEqual([
      path.resolve(__dirname, 'node_modules'),
      path.resolve(__dirname, '../../node_modules'),
    ]);
  });

  it('resolves TanStack Query Core from the mobile dependency tree', () => {
    expect(resolveQueryCore()).toEqual({
      filePath: expect.stringMatching(
        /@tanstack\/query-core\/build\/modern\/index\.cjs$/,
      ),
      type: 'sourceFile',
    });
  });
});

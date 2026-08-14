import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

function resolveUiNative() {
  const url = pathToFileURL(path.resolve(__dirname, 'metro.config.mjs')).href;
  const script = `process.env.NODE_ENV = 'development'; const { default: config } = await import(${JSON.stringify(url)}); const result = config.resolver.resolveRequest({ resolveRequest: () => null }, '@palea/ui-native', 'web'); console.log(JSON.stringify(result));`;
  return JSON.parse(
    execFileSync(process.execPath, ['--input-type=module', '--eval', script], {
      encoding: 'utf8',
    }),
  );
}

describe('mobile Metro development resolution', () => {
  it('uses the UI component source entry', () => {
    expect(resolveUiNative()).toEqual({
      filePath: path.resolve(
        __dirname,
        '../../packages/ui-native/src/index.ts',
      ),
      type: 'sourceFile',
    });
  });
});

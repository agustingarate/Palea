import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

describe('mobile Metro development resolution', () => {
  it('uses the UI component source entry', () => {
    const configUrl = pathToFileURL(
      path.resolve(__dirname, 'metro.config.mjs'),
    ).href;
    const script = `
      import config from ${JSON.stringify(configUrl)};
      const result = config.resolver.resolveRequest(
        { resolveRequest: () => ({ fallback: true }) },
        '@palea/ui-native',
        'web'
      );
      console.log(JSON.stringify(result));
    `;
    const output = execFileSync(
      process.execPath,
      ['--input-type=module', '--eval', script],
      { cwd: __dirname, env: { ...process.env, NODE_ENV: 'development' } },
    ).toString();

    expect(JSON.parse(output)).toEqual({
      filePath: path.resolve(
        __dirname,
        '../../packages/ui-native/src/index.ts',
      ),
      type: 'sourceFile',
    });
  });
});

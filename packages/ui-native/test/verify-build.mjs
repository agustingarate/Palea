import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

for (const fileName of ['index.js', 'index.cjs']) {
  const output = readFileSync(resolve('dist', fileName), 'utf8');

  assert.match(output, /nativewind\/jsx-runtime/);
  assert.doesNotMatch(output, /react\/jsx-runtime/);
}

console.log('ui-native build uses the NativeWind JSX runtime in ESM and CJS.');

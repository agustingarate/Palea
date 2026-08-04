const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');

for (const fileName of ['index.js', 'index.cjs']) {
  const output = readFileSync(resolve('dist', fileName), 'utf8');

  assert.match(output, /nativewind\/jsx-runtime/);
  assert.doesNotMatch(output, /react\/jsx-runtime/);
}

console.log('ui-native build uses the NativeWind JSX runtime in ESM and CJS.');

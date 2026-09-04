import { cpSync, mkdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

export function prepareTesseractAssets(projectRoot) {
  const require = createRequire(path.join(projectRoot, 'package.json'));
  const packagePath = require.resolve('tesseract.js/package.json');
  const root = path.dirname(packagePath);
  const { version } = JSON.parse(readFileSync(packagePath, 'utf8'));
  const output = path.join(projectRoot, 'public/tesseract', version);
  mkdirSync(output, { recursive: true });

  cpSync(
    path.join(root, 'dist/worker.min.js'),
    path.join(output, 'worker.min.js'),
  );
  const coreRoot = path.dirname(
    require.resolve('tesseract.js-core/package.json'),
  );
  for (const name of [
    'tesseract-core.wasm.js',
    'tesseract-core-simd.wasm.js',
    'tesseract-core-lstm.wasm.js',
    'tesseract-core-simd-lstm.wasm.js',
    'tesseract-core.wasm',
    'tesseract-core-simd.wasm',
    'tesseract-core-lstm.wasm',
    'tesseract-core-simd-lstm.wasm',
  ]) {
    cpSync(path.join(coreRoot, name), path.join(output, name));
  }
  for (const language of ['eng', 'spa']) {
    const languageRoot = path.dirname(
      require.resolve(`@tesseract.js-data/${language}/package.json`),
    );
    cpSync(
      path.join(languageRoot, '4.0.0', `${language}.traineddata.gz`),
      path.join(output, `${language}.traineddata.gz`),
    );
  }
}

import { cpSync, mkdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

// PDF.js workers, fonts and codecs are served from our own origin. Keep the
// version in the URL so a cached worker can never mismatch the library bundle.
export function preparePdfAssets(projectRoot) {
  const require = createRequire(path.join(projectRoot, 'package.json'));
  const packagePath = require.resolve('pdfjs-dist/package.json');
  const root = path.dirname(packagePath);
  const { version } = JSON.parse(readFileSync(packagePath, 'utf8'));
  const output = path.join(projectRoot, 'public/pdfjs', version);
  mkdirSync(output, { recursive: true });
  for (const name of ['cmaps', 'standard_fonts', 'wasm']) {
    cpSync(path.join(root, name), path.join(output, name), { recursive: true });
  }
  cpSync(
    path.join(root, 'build/pdf.worker.min.mjs'),
    path.join(output, 'pdf.worker.min.mjs'),
  );
  cpSync(path.join(root, 'build/pdf.mjs'), path.join(output, 'pdf.mjs'));
  cpSync(
    path.join(root, 'web/pdf_viewer.mjs'),
    path.join(output, 'pdf_viewer.mjs'),
  );
  cpSync(path.join(root, 'LICENSE'), path.join(output, 'LICENSE'));
  cpSync(
    path.join(root, 'web/pdf_viewer.css'),
    path.join(output, 'pdf_viewer.css'),
  );
  cpSync(path.join(root, 'web/images'), path.join(output, 'images'), {
    recursive: true,
  });
}

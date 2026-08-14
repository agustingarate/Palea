import { createReadStream, existsSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';

const root = resolve('apps/mobile/dist');
const contentTypes: Record<string, string> = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.ttf': 'font/ttf',
};

export default async function globalSetup() {
  const server = createServer((request, response) => {
    const pathname = decodeURIComponent(
      new URL(request.url ?? '/', 'http://localhost').pathname,
    );
    const candidate = normalize(join(root, pathname));
    const safeCandidate = candidate.startsWith(root)
      ? candidate
      : join(root, 'index.html');
    const file =
      existsSync(safeCandidate) && extname(safeCandidate)
        ? safeCandidate
        : join(root, 'index.html');

    response.setHeader(
      'content-type',
      contentTypes[extname(file)] ?? 'application/octet-stream',
    );
    createReadStream(file).pipe(response);
  });

  await new Promise<void>((resolveListening, reject) => {
    server.once('error', reject);
    server.listen(8081, '127.0.0.1', resolveListening);
  });

  return async () => {
    server.closeIdleConnections();
    server.closeAllConnections();
    await new Promise<void>((resolveClosed, reject) => {
      server.close((error) => (error ? reject(error) : resolveClosed()));
    });
  };
}

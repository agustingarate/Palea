import { parentPort, workerData } from 'node:worker_threads';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

// Parsing untrusted PDFs stays off the API event loop and has a bounded lifetime.
const task = getDocument({
  data: new Uint8Array(workerData),
  stopAtErrors: true,
  isEvalSupported: false,
  useSystemFonts: false,
  disableFontFace: true,
  enableXfa: false,
  verbosity: 0,
});
try {
  const document = await task.promise;
  if (document.numPages < 1 || (await document.getPermissions()) !== null) {
    throw new Error('Protected or empty PDF');
  }
  for (let number = 1; number <= document.numPages; number += 1) {
    const page = await document.getPage(number);
    await page.getOperatorList();
    page.cleanup();
  }
  parentPort.postMessage(true);
} catch {
  // Neither errors from the parser nor document contents leave this worker.
  parentPort.postMessage(false);
} finally {
  await task.destroy();
}

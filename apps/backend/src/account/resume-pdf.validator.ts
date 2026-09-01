import { join } from 'node:path';
import { Worker } from 'node:worker_threads';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ResumePdfValidator {
  validate(bytes: Uint8Array): Promise<boolean> {
    return new Promise((resolve) => {
      const worker = new Worker(join(__dirname, 'resume-pdf.worker.mjs'), {
        workerData: bytes,
        resourceLimits: { maxOldGenerationSizeMb: 256 },
      });
      const finish = (valid: boolean) => {
        clearTimeout(timeout);
        void worker.terminate();
        resolve(valid);
      };
      const timeout = setTimeout(() => finish(false), 20_000);
      worker.once('message', (valid: unknown) => finish(valid === true));
      worker.once('error', () => finish(false));
      worker.once('exit', () => finish(false));
    });
  }
}

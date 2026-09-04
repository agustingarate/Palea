import type {
  JobDescriptionImportPort,
  JobDescriptionImportResult,
} from '../../domain/jobDescriptionImport';
import { z } from 'zod';
import {
  normalizeVisibleText,
  semanticOcrLinesToSafeHtml,
  type OcrSemanticLine,
} from '../../domain/jobDescriptionImport';

const TESSERACT_VERSION = '5.1.1';
const ASSET_ROOT = `/tesseract/${TESSERACT_VERSION}`;
const ocrParagraphsSchema = z.array(
  z.object({
    text: z.string().max(50_000),
    lines: z.array(
      z.object({
        text: z.string().max(50_000),
        bbox: z.object({
          x0: z.number().nonnegative(),
          y0: z.number().nonnegative(),
          x1: z.number().nonnegative(),
          y1: z.number().nonnegative(),
        }),
        words: z.array(
          z.object({
            font_size: z.number().nonnegative(),
            is_bold: z.boolean(),
          }),
        ),
      }),
    ),
  }),
);

/** Browser-only OCR. Its worker, WASM core and language data are served by Palea. */
export class TesseractWebJobDescriptionImportDataSource implements JobDescriptionImportPort {
  async importFromUrl(): Promise<JobDescriptionImportResult> {
    throw new Error('URL import is unavailable on web');
  }

  async importFromImage(
    input: { uri: string },
    signal: AbortSignal,
  ): Promise<JobDescriptionImportResult> {
    const { createWorker } = await import('tesseract.js');
    let cancelled = signal.aborted;
    const worker = await createWorker(['eng', 'spa'], 1, {
      workerPath: `${ASSET_ROOT}/worker.min.js`,
      corePath: ASSET_ROOT,
      langPath: ASSET_ROOT,
      workerBlobURL: false,
      logger: () => undefined,
      errorHandler: () => undefined,
    });
    const cancel = () => {
      cancelled = true;
      void worker.terminate();
    };
    signal.addEventListener('abort', cancel, { once: true });
    try {
      if (cancelled) return { status: 'cancelled' };
      const result = await worker.recognize(
        input.uri,
        {},
        { blocks: true, text: true },
      );
      if (cancelled) return { status: 'cancelled' };
      const paragraphs = ocrParagraphsSchema.safeParse(
        result.data.paragraphs,
      ).data;
      const text = normalizeVisibleText(
        paragraphs?.length
          ? paragraphs.map((paragraph) => paragraph.text).join('\n\n')
          : z.string().max(50_000).parse(result.data.text),
      );
      if (!text) return { status: 'empty' };
      const lines: OcrSemanticLine[] =
        paragraphs?.flatMap((paragraph) =>
          paragraph.lines.map((line) => ({
            text: line.text,
            fontSize: average(line.words.map((word) => word.font_size)),
            isBold:
              line.words.length > 0 &&
              line.words.filter((word) => word.is_bold).length /
                line.words.length >=
                0.6,
            x: line.bbox.x0,
            y: line.bbox.y0,
            height: Math.max(1, line.bbox.y1 - line.bbox.y0),
          })),
        ) ?? [];
      return {
        status: 'success',
        text,
        html: lines.length ? semanticOcrLinesToSafeHtml(lines) : undefined,
      };
    } finally {
      signal.removeEventListener('abort', cancel);
      await worker.terminate();
    }
  }
}

function average(values: readonly number[]) {
  const usable = values.filter(Boolean);
  return usable.length
    ? usable.reduce((sum, value) => sum + value, 0) / usable.length
    : 1;
}

import { extractTextFromImage, isSupported } from 'expo-text-extractor';
import type {
  JobDescriptionImportPort,
  JobDescriptionImportResult,
} from '../../domain/jobDescriptionImport';
import { z } from 'zod';
import { normalizeVisibleText } from '../../domain/jobDescriptionImport';

/** iOS uses Apple Vision and Android uses Google ML Kit through the Expo module. */
export class NativeJobDescriptionImportDataSource implements JobDescriptionImportPort {
  async importFromUrl(): Promise<JobDescriptionImportResult> {
    throw new Error('URL import requires the isolated native WebView adapter');
  }

  async importFromImage(
    input: { uri: string },
    signal: AbortSignal,
  ): Promise<JobDescriptionImportResult> {
    if (!isSupported)
      throw new Error('Local OCR is unavailable on this device');
    if (signal.aborted) return { status: 'cancelled' };
    const fragments = await extractTextFromImage(input.uri);
    if (signal.aborted) return { status: 'cancelled' };
    const text = normalizeVisibleText(
      z.array(z.string()).parse(fragments).join('\n'),
    );
    return text ? { status: 'success', text } : { status: 'empty' };
  }
}

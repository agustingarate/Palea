import { useCallback, useEffect, useRef, useState } from 'react';
import { useDependency } from '@/core/di/DependenciesProvider';
import { dependencyTokens } from '@/core/di/dependencies';
import type { ImportStatus } from '../../domain/jobDescriptionImport';
import { visibleTextToSafeHtml } from '../../domain/jobDescriptionImport';

export function useJobDescriptionImport() {
  const importer = useDependency(dependencyTokens.jobDescriptionImport);
  const picker = useDependency(dependencyTokens.jobDescriptionImagePicker);
  const controller = useRef<AbortController | null>(null);
  const [status, setStatus] = useState<ImportStatus>('idle');
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);

  const cancel = useCallback(() => controller.current?.abort(), []);
  useEffect(() => () => controller.current?.abort(), []);

  const importImageUri = useCallback(
    async (uri: string, release?: () => void) => {
      if (status === 'loading') {
        release?.();
        return;
      }
      const next = new AbortController();
      controller.current = next;
      setStatus('loading');
      setPreviewHtml(null);
      try {
        const result = await importer.importFromImage({ uri }, next.signal);
        if (result.status === 'success') {
          setPreviewHtml(result.html ?? visibleTextToSafeHtml(result.text));
          setStatus('success');
        } else {
          setStatus(result.status);
        }
      } catch {
        setStatus(next.signal.aborted ? 'cancelled' : 'error');
      } finally {
        if (controller.current === next) controller.current = null;
        release?.();
      }
    },
    [importer, status],
  );

  const importImage = useCallback(async () => {
    if (status === 'loading') return;
    const image = await picker.pickImage();
    if (!image?.uri) {
      setStatus('cancelled');
      return;
    }
    await importImageUri(image.uri);
  }, [importImageUri, picker, status]);

  const dismiss = useCallback(() => {
    setPreviewHtml(null);
    setStatus('idle');
  }, []);

  return { status, previewHtml, importImage, importImageUri, cancel, dismiss };
}

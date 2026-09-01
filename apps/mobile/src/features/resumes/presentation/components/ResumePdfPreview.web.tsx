import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { AppText, FeedbackMessage } from '@palea/ui-native';
import type { PDFDocumentLoadingTask, PDFWorker } from 'pdfjs-dist';
import type * as PdfJs from 'pdfjs-dist';
import type * as PdfJsViewer from 'pdfjs-dist/web/pdf_viewer.mjs';
import type { PDFViewer } from 'pdfjs-dist/types/web/pdf_viewer';
import { useLocale } from '@/core/localization/LocaleProvider';
import { ResumeViewerToolbar } from './ResumeViewerToolbar';
import type { ResumePdfPreviewProps } from './ResumePdfPreview.types';
import pdfjsPackage from 'pdfjs-dist/package.json';

export function ResumePdfPreview(props: ResumePdfPreviewProps) {
  const { url, loading, error, onRetry } = props;
  const { t, i18n } = useLocale('resumes');
  const container = useRef<HTMLDivElement>(null);
  const viewerElement = useRef<HTMLDivElement>(null);
  const viewer = useRef<PDFViewer | null>(null);
  const accessError = useRef(props.onAccessError);
  accessError.current = props.onAccessError;
  const [renderState, setRenderState] = useState<'loading' | 'ready' | 'error'>(
    'loading',
  );
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(0);
  const [zoom, setZoom] = useState(100);

  useEffect(() => {
    if (!url || !container.current || !viewerElement.current) return;
    const documentContainer = viewerElement.current;
    let disposed = false;
    let loadingTask: PDFDocumentLoadingTask | undefined;
    let pdfWorker: PDFWorker | undefined;
    let port: Worker | undefined;
    let observer: ResizeObserver | undefined;
    let phase = 'engine';
    setRenderState('loading');
    setPages(0);
    setPage(1);
    void (async () => {
      // Load PDF.js only after a selection, before its viewer module consumes it.
      const assets = `/pdfjs/${pdfjsPackage.version}/`;
      const pdfjs: typeof PdfJs = await import(
        /* @metro-ignore */ `${assets}pdf.mjs`
      );
      phase = 'viewer-module';
      const { EventBus, PDFViewer, GenericL10n }: typeof PdfJsViewer =
        await import(/* @metro-ignore */ `${assets}pdf_viewer.mjs`);
      if (disposed || !container.current || !viewerElement.current) return;
      phase = 'worker';
      port = new Worker(`${assets}pdf.worker.min.mjs`, { type: 'module' });
      pdfWorker = pdfjs.PDFWorker.create({ port });
      const eventBus = new EventBus();
      phase = 'viewer-layout';
      const instance = new PDFViewer({
        container: container.current,
        viewer: viewerElement.current,
        eventBus,
        l10n: new GenericL10n(i18n.language),
        annotationMode: pdfjs.AnnotationMode.DISABLE,
        annotationEditorMode: pdfjs.AnnotationEditorType.DISABLE,
        maxCanvasPixels: 16_777_216,
      });
      viewer.current = instance;
      eventBus.on('pagesinit', () => {
        if (disposed) return;
        instance.currentScaleValue = 'page-width';
        setRenderState('ready');
      });
      eventBus.on('pagechanging', (event: { pageNumber: number }) => {
        if (!disposed) setPage(event.pageNumber);
      });
      eventBus.on('scalechanging', (event: { scale: number }) => {
        if (!disposed) setZoom(Math.round(event.scale * 100));
      });
      eventBus.on('pagerendered', (event: { error?: unknown }) => {
        if (!disposed && event.error) {
          setRenderState('error');
          accessError.current?.();
        }
      });
      phase = 'document';
      loadingTask = pdfjs.getDocument({
        url,
        worker: pdfWorker,
        cMapUrl: `${assets}cmaps/`,
        cMapPacked: true,
        standardFontDataUrl: `${assets}standard_fonts/`,
        wasmUrl: `${assets}wasm/`,
        enableXfa: false,
      });
      const document = await loadingTask.promise;
      if (disposed) return;
      setPages(document.numPages);
      instance.setDocument(document);
      observer = new ResizeObserver(() => {
        if (instance.currentScaleValue === 'page-width') {
          instance.currentScaleValue = 'page-width';
        }
      });
      observer.observe(container.current);
    })().catch((failure: unknown) => {
      // Never log PDF bytes or signed access URLs.
      if (__DEV__)
        console.warn(
          'PDF rendering failed ' +
            JSON.stringify({
              phase,
              type: failure instanceof Error ? failure.name : 'unknown',
              reason:
                phase === 'engine' && failure instanceof Error
                  ? failure.message.replace(/https?:\/\/[^\s)]+/g, '[source]')
                  : undefined,
            }),
        );
      if (!disposed) {
        setRenderState('error');
        accessError.current?.();
      }
    });
    return () => {
      disposed = true;
      observer?.disconnect();
      viewer.current?.cleanup();
      viewer.current = null;
      void loadingTask?.destroy();
      pdfWorker?.destroy();
      port?.terminate();
      documentContainer.replaceChildren();
    };
  }, [url, i18n.language]);

  const failed = Boolean(error) || renderState === 'error';
  const ready = Boolean(url) && !loading && !failed && renderState === 'ready';
  return (
    <View className="min-w-0 flex-1 bg-surface-subtle dark:bg-dark-surface-subtle">
      <link
        rel="stylesheet"
        href={`/pdfjs/${pdfjsPackage.version}/pdf_viewer.css`}
      />
      <ResumeViewerToolbar
        {...props}
        page={page}
        pages={pages}
        zoom={zoom}
        ready={ready}
        onPrevious={() => {
          if (viewer.current) viewer.current.currentPageNumber -= 1;
        }}
        onNext={() => {
          if (viewer.current) viewer.current.currentPageNumber += 1;
        }}
        onZoomIn={() => {
          if (viewer.current)
            viewer.current.currentScale = Math.min(
              3,
              viewer.current.currentScale * 1.2,
            );
        }}
        onZoomOut={() => {
          if (viewer.current)
            viewer.current.currentScale = Math.max(
              0.5,
              viewer.current.currentScale / 1.2,
            );
        }}
        onFit={() => {
          if (viewer.current) viewer.current.currentScaleValue = 'page-width';
        }}
      />
      <View className="relative flex-1">
        <div
          ref={container}
          aria-label={props.title}
          tabIndex={0}
          style={{
            position: 'absolute',
            inset: 0,
            overflow: 'auto',
            overscrollBehavior: 'contain',
            visibility: ready ? 'visible' : 'hidden',
          }}
        >
          <div ref={viewerElement} className="pdfViewer" />
        </div>
        {!ready ? (
          <View className="absolute inset-0 items-center justify-center p-6">
            {failed ? (
              <FeedbackMessage
                title={t('viewerErrorTitle')}
                message={t('viewerErrorMessage')}
                tone="danger"
                actionLabel={t('retry')}
                onAction={onRetry}
              />
            ) : (
              <View
                className="items-center gap-3"
                accessibilityLiveRegion="polite"
              >
                <ActivityIndicator />
                <AppText variant="bodySmall" tone="muted">
                  {t('viewerLoading')}
                </AppText>
              </View>
            )}
          </View>
        ) : null}
      </View>
    </View>
  );
}

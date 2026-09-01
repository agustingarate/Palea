import { useRef, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import Pdf, { type PdfRef } from 'react-native-pdf';
import { FeedbackMessage } from '@palea/ui-native';
import { useLocale } from '@/core/localization/LocaleProvider';
import { ResumeViewerToolbar } from './ResumeViewerToolbar';
import type { ResumePdfPreviewProps } from './ResumePdfPreview.types';

export function ResumePdfPreview(props: ResumePdfPreviewProps) {
  return <NativeResumePdfPreview key={props.url ?? 'loading'} {...props} />;
}

function NativeResumePdfPreview(props: ResumePdfPreviewProps) {
  const { t } = useLocale('resumes');
  const pdf = useRef<PdfRef>(null);
  const [pages, setPages] = useState(0);
  const [page, setPage] = useState(1);
  const [scale, setScale] = useState(1);
  const [failed, setFailed] = useState(false);
  const ready = pages > 0 && !failed && !props.error && !props.loading;
  return (
    <View className="flex-1 bg-surface-subtle dark:bg-dark-surface-subtle">
      <ResumeViewerToolbar
        {...props}
        page={page}
        pages={pages}
        zoom={Math.round(scale * 100)}
        ready={ready}
        onPrevious={() => pdf.current?.setPage(page - 1)}
        onNext={() => pdf.current?.setPage(page + 1)}
        onZoomIn={() => setScale(Math.min(3, scale * 1.2))}
        onZoomOut={() => setScale(Math.max(0.5, scale / 1.2))}
        onFit={() => setScale(1)}
      />
      {failed || props.error ? (
        <View className="flex-1 justify-center p-6">
          <FeedbackMessage
            title={t('viewerErrorTitle')}
            message={t('viewerErrorMessage')}
            tone="danger"
            actionLabel={t('retry')}
            onAction={() => {
              setFailed(false);
              setPages(0);
              props.onRetry();
            }}
          />
        </View>
      ) : props.url ? (
        <Pdf
          key={props.url}
          ref={pdf}
          source={{ uri: props.url, cache: false }}
          style={{ flex: 1, width: '100%' }}
          scale={scale}
          minScale={0.5}
          maxScale={3}
          fitPolicy={0}
          trustAllCerts={false}
          enablePaging={false}
          enableAnnotationRendering={false}
          onLoadComplete={(count) => setPages(count)}
          onPageChanged={setPage}
          onScaleChanged={setScale}
          renderActivityIndicator={() => <ActivityIndicator />}
          onError={() => {
            setFailed(true);
            props.onAccessError?.();
          }}
        />
      ) : (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      )}
    </View>
  );
}

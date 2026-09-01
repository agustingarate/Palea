import { View } from 'react-native';
import { AppText, Button, IconButton } from '@palea/ui-native';
import { useLocale } from '@/core/localization/LocaleProvider';
import type { ResumePdfPreviewProps } from './ResumePdfPreview.types';

export function ResumeViewerToolbar({
  title,
  page,
  pages,
  zoom,
  ready,
  onPrevious,
  onNext,
  onZoomIn,
  onZoomOut,
  onFit,
  onDownload,
  downloadPending,
  onClose,
  onExpand,
}: Pick<
  ResumePdfPreviewProps,
  'title' | 'onDownload' | 'downloadPending' | 'onClose' | 'onExpand'
> & {
  page: number;
  pages: number;
  zoom: number;
  ready: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFit: () => void;
}) {
  const { t } = useLocale('resumes');
  return (
    <View className="border-b border-border bg-surface dark:border-dark-border dark:bg-dark-surface">
      <View className="min-h-14 flex-row items-center gap-2 px-3">
        <AppText variant="label" numberOfLines={1} className="min-w-0 flex-1">
          {title}
        </AppText>
        <IconButton
          icon="download"
          iconSize="md"
          accessibilityLabel={t('download')}
          disabled={downloadPending}
          onPress={onDownload}
        />
        {onExpand ? (
          <IconButton
            icon="maximize"
            iconSize="md"
            accessibilityLabel={t('expandViewer')}
            onPress={onExpand}
          />
        ) : null}
        {onClose ? (
          <IconButton
            icon="close"
            iconSize="md"
            accessibilityLabel={t('closeViewer')}
            onPress={onClose}
          />
        ) : null}
      </View>
      <View className="flex-row flex-wrap items-center justify-between gap-1 border-t border-border px-2 py-1 dark:border-dark-border">
        <View className="flex-row items-center">
          <IconButton
            icon="zoomOut"
            iconSize="sm"
            accessibilityLabel={t('zoomOut')}
            disabled={!ready || zoom <= 50}
            onPress={onZoomOut}
          />
          <AppText variant="caption" className="w-12 text-center">
            {ready ? `${zoom}%` : '—'}
          </AppText>
          <IconButton
            icon="zoomIn"
            iconSize="sm"
            accessibilityLabel={t('zoomIn')}
            disabled={!ready || zoom >= 300}
            onPress={onZoomIn}
          />
          <Button
            label={t('fitWidth')}
            size="sm"
            variant="ghost"
            disabled={!ready}
            onPress={onFit}
          />
        </View>
        <View className="flex-row items-center">
          <IconButton
            icon="arrowBack"
            iconSize="sm"
            accessibilityLabel={t('previousPage')}
            disabled={!ready || page <= 1}
            onPress={onPrevious}
          />
          <AppText variant="caption" accessibilityLiveRegion="polite">
            {page} / {pages || '—'}
          </AppText>
          <IconButton
            icon="arrowForward"
            iconSize="sm"
            accessibilityLabel={t('nextPage')}
            disabled={!ready || page >= pages}
            onPress={onNext}
          />
        </View>
      </View>
    </View>
  );
}

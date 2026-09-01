import { View } from 'react-native';
import { AppText, Button, Icon, SegmentedControl } from '@palea/ui-native';
import { useLocale } from '@/core/localization/LocaleProvider';
import type { ResumeCollectionView } from './ResumeLibraryCollection';

export function ResumeLibraryHeader({
  view,
  count,
  onViewChange,
  onUpload,
  uploadDisabled,
  uploading,
}: {
  view: ResumeCollectionView;
  count: number;
  onViewChange: (view: ResumeCollectionView) => void;
  onUpload: () => void;
  uploadDisabled: boolean;
  uploading: boolean;
}) {
  const { t } = useLocale('resumes');
  return (
    <View className="gap-7">
      <View className="flex-row flex-wrap items-start justify-between gap-4">
        <View className="min-w-0 flex-1 gap-2" style={{ minWidth: 200 }}>
          <AppText accessibilityRole="header" variant="screenTitle">
            {t('title')}
          </AppText>
          <AppText variant="bodySmall" tone="muted">
            {t('subtitle')}
          </AppText>
        </View>
        {count > 0 ? (
          <Button
            label={t('upload')}
            nativeID="resume-library-upload"
            leadingIcon="add"
            loading={uploading}
            disabled={uploadDisabled}
            onPress={onUpload}
          />
        ) : null}
      </View>
      <View className="flex-row items-center justify-between gap-3">
        <View className="flex-row items-center gap-2">
          <AppText variant="label">{t('collectionTitle')}</AppText>
          <View className="rounded-full bg-surface-subtle px-2 py-1 dark:bg-dark-surface-subtle">
            <AppText variant="caption" tone="muted">
              {count}
            </AppText>
          </View>
        </View>
        <SegmentedControl
          compact
          hideLabel
          label={t('view')}
          value={view}
          onValueChange={(value) => onViewChange(value as ResumeCollectionView)}
          items={[
            { value: 'grid', label: t('grid'), icon: 'grid' },
            { value: 'list', label: t('list'), icon: 'list' },
          ]}
        />
      </View>
    </View>
  );
}

export function ResumePrivacyNote() {
  const { t } = useLocale('resumes');
  return (
    <View className="flex-row items-center justify-center gap-2 py-3">
      <Icon name="lock" size="sm" tone="muted" />
      <AppText variant="caption" tone="muted">
        {t('private')}
      </AppText>
    </View>
  );
}

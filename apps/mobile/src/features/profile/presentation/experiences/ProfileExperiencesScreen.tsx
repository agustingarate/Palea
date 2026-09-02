import { View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  AppText,
  Badge,
  Breadcrumbs,
  Button,
  CollectionFeedback,
  IconButton,
  ScrollScreen,
  Surface,
  useResponsiveLayout,
} from '@palea/ui-native';
import { useLocale } from '@/core/localization/LocaleProvider';
import type { ProfileExperienceSummary } from '../../domain/entities/Profile';
import { useProfileExperiencesViewModel } from './useProfileExperiencesViewModel';

export function ProfileExperiencesScreen() {
  const { t, i18n } = useLocale('profile');
  const router = useRouter();
  const vm = useProfileExperiencesViewModel();
  const layout = useResponsiveLayout();
  return (
    <ScrollScreen contentClassName="gap-5">
      <View
        className="w-full gap-5"
        style={
          layout.isWeb
            ? {
                alignSelf: 'center',
                maxWidth: layout.isExpanded ? 880 : 600,
              }
            : undefined
        }
      >
        {layout.isWeb ? (
          <Breadcrumbs
            homeLabel={t('breadcrumbHome')}
            onHomePress={() => router.replace('/profile' as never)}
            items={[
              {
                label: t('title'),
                onPress: () => router.replace('/profile' as never),
              },
              { label: t('experienceTitle') },
            ]}
          />
        ) : null}
        <View className="flex-row items-start justify-between gap-4">
          <View className="flex-1 gap-1">
            <IconButton
              icon="arrowBack"
              accessibilityLabel={t('back')}
              onPress={() => router.back()}
            />
            <AppText
              variant={layout.isCompact ? 'sectionTitle' : 'screenTitle'}
            >
              {t('experienceTitle')}
            </AppText>
            <AppText tone="muted">{t('experienceSubtitle')}</AppText>
          </View>
          <Button
            label={
              layout.isCompact ? t('experienceAddCompact') : t('experienceAdd')
            }
            leadingIcon="add"
            onPress={() => router.push('/profile/experiences/new' as never)}
          />
        </View>
        {vm.isLoading ? <CollectionFeedback status="loading" rows={4} /> : null}
        {vm.isInitialError ? (
          <CollectionFeedback
            status="error"
            title={t('experienceErrorTitle')}
            message={t('experienceErrorMessage')}
            actionLabel={t('retry')}
            onAction={() => void vm.retry()}
          />
        ) : null}
        {!vm.isLoading && !vm.isInitialError && vm.items.length === 0 ? (
          <CollectionFeedback
            status="empty"
            title={t('experienceEmptyTitle')}
            message={t('experienceEmptyMessage')}
            actionLabel={t('experienceAdd')}
            onAction={() => router.push('/profile/experiences/new' as never)}
          />
        ) : null}
        <View className="gap-3">
          {vm.items.map((item) => (
            <ExperienceRow
              key={item.id}
              item={item}
              locale={i18n.language}
              onEdit={() =>
                router.push(`/profile/experiences/${item.id}/edit` as never)
              }
            />
          ))}
        </View>
        {vm.isIncrementalError ? (
          <Surface variant="subtle" className="gap-2">
            <AppText accessibilityLiveRegion="polite" tone="danger">
              {t('experienceIncrementalError')}
            </AppText>
            <Button
              label={t('retry')}
              variant="ghost"
              size="sm"
              onPress={() => void vm.loadMore()}
            />
          </Surface>
        ) : null}
        {vm.hasMore ? (
          <Button
            label={t('loadMore')}
            variant="secondary"
            loading={vm.isFetchingMore}
            onPress={() => void vm.loadMore()}
          />
        ) : vm.items.length > 0 ? (
          <AppText variant="label" tone="muted" className="text-center">
            {t('experienceEnd')}
          </AppText>
        ) : null}
      </View>
    </ScrollScreen>
  );
}

function ExperienceRow({
  item,
  locale,
  onEdit,
}: {
  item: ProfileExperienceSummary;
  locale: string;
  onEdit: () => void;
}) {
  const { t } = useLocale('profile');
  const format = (value: string | null) =>
    value
      ? new Intl.DateTimeFormat(locale, {
          month: 'short',
          year: 'numeric',
        }).format(new Date(`${value}T12:00:00`))
      : t('unavailable');
  return (
    <Surface variant="default" className="gap-4">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1 gap-2">
          <View className="flex-row flex-wrap items-center gap-2">
            <AppText variant="sectionTitle">{item.role}</AppText>
            {item.isCurrent ? (
              <Badge label={t('experienceCurrentBadge')} tone="success" />
            ) : null}
          </View>
          <AppText variant="bodySmall" tone="muted">
            {item.companyName}
          </AppText>
          <AppText variant="label" tone="muted">
            {item.isCurrent
              ? t('experienceFrom', { date: format(item.startedOn) })
              : t('experienceRange', {
                  start: format(item.startedOn),
                  end: format(item.endedOn),
                })}
          </AppText>
        </View>
        <Button
          label={t('experienceEdit')}
          accessibilityLabel={t('experienceOpen', {
            role: item.role,
            company: item.companyName,
          })}
          size="sm"
          variant="secondary"
          leadingIcon="edit"
          onPress={onEdit}
        />
      </View>
    </Surface>
  );
}

import { View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  AppText,
  Breadcrumbs,
  Button,
  Chip,
  CollectionFeedback,
  Icon,
  IconButton,
  SearchableSelect,
  ScrollScreen,
  Surface,
  useResponsiveLayout,
  useSnackbar,
} from '@palea/ui-native';
import { useLocale } from '@/core/localization/LocaleProvider';
import { toProfileLocale } from '../viewmodels/profileLocale';
import { useProfileSkillsViewModel } from './useProfileSkillsViewModel';

export function ProfileSkillsScreen() {
  const { t, i18n } = useLocale('profile');
  const router = useRouter();
  const { showSnackbar } = useSnackbar();
  const layout = useResponsiveLayout();
  const vm = useProfileSkillsViewModel(toProfileLocale(i18n.language));
  const save = async () => {
    try {
      await vm.save.mutateAsync();
      showSnackbar({ variant: 'success', message: t('skillsSaveSuccess') });
      router.replace('/profile' as never);
    } catch {
      // Mutation error renders below and the local selection is preserved.
    }
  };
  if (vm.detail.isPending)
    return (
      <ScrollScreen>
        <CollectionFeedback status="loading" rows={4} />
      </ScrollScreen>
    );
  if (!vm.detail.data)
    return (
      <ScrollScreen>
        <CollectionFeedback
          status="error"
          title={t('skillsErrorTitle')}
          message={t('skillsErrorMessage')}
          actionLabel={t('retry')}
          onAction={() => void vm.detail.refetch()}
        />
      </ScrollScreen>
    );
  const remaining = 10 - vm.selected.length;
  const skillOptions = vm.items.map((skill) => ({
    value: skill.id,
    label: skill.label,
    description: skill.slug,
    keywords: [skill.slug, skill.label],
  }));
  return (
    <ScrollScreen keyboardAware contentClassName="gap-5">
      <View
        className="w-full gap-5"
        style={
          layout.isWeb
            ? {
                alignSelf: 'center',
                maxWidth: layout.isExpanded ? 960 : 600,
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
              { label: t('skillsTitle') },
            ]}
          />
        ) : null}
        <View className="gap-1">
          <IconButton
            icon="arrowBack"
            accessibilityLabel={t('back')}
            disabled={vm.save.isPending}
            onPress={() => router.back()}
          />
          <AppText variant="screenTitle">{t('skillsTitle')}</AppText>
          <AppText tone="muted">{t('skillsSubtitle')}</AppText>
        </View>
        <View className="gap-5 md:flex-row md:items-start">
          <Surface variant="default" className="gap-3 md:w-64">
            <View className="flex-row items-center justify-between">
              <AppText variant="label">{t('skillsCapacity')}</AppText>
              <AppText variant="sectionTitle">
                {t('skillsCount', { count: vm.selected.length })}
              </AppText>
            </View>
            <View className="h-2 overflow-hidden rounded-full bg-surface-subtle dark:bg-dark-surface-subtle">
              <View
                className="h-full rounded-full bg-interaction dark:bg-dark-interaction"
                style={{ width: `${vm.selected.length * 10}%` }}
              />
            </View>
            <AppText variant="bodySmall" tone="muted">
              {remaining === 0
                ? t('skillsLimit')
                : t('skillsRemaining', { count: remaining })}
            </AppText>
          </Surface>
          <View className="flex-1 gap-5">
            <Surface variant="default" className="gap-4">
              <View className="gap-1">
                <AppText variant="sectionTitle">{t('skillsSelected')}</AppText>
                <AppText variant="bodySmall" tone="muted">
                  {t('skillsSelectedHelp')}
                </AppText>
              </View>
              {vm.selected.length === 0 ? (
                <View
                  accessibilityRole="summary"
                  className="items-center gap-3 border-t border-dashed border-border px-4 py-7 dark:border-dark-border"
                >
                  <View className="h-11 w-11 items-center justify-center rounded-full bg-surface-subtle dark:bg-dark-surface-subtle">
                    <Icon
                      name="slidersHorizontal"
                      size="lg"
                      tone="interaction"
                    />
                  </View>
                  <View className="max-w-sm items-center gap-1">
                    <AppText variant="sectionTitle" className="text-center">
                      {t('skillsEmptyTitle')}
                    </AppText>
                    <AppText className="text-center" tone="muted">
                      {t('skillsEmptyMessage')}
                    </AppText>
                  </View>
                </View>
              ) : (
                <View className="flex-row flex-wrap gap-2">
                  {vm.selected.map((skill) => (
                    <Chip
                      key={skill.id}
                      label={skill.label}
                      selected
                      accessibilityLabel={t('skillsRemove', {
                        skill: skill.label,
                      })}
                      disabled={vm.save.isPending}
                      removeAccessibilityLabel={t('skillsRemove', {
                        skill: skill.label,
                      })}
                      onRemove={() => vm.toggle(skill)}
                    />
                  ))}
                </View>
              )}
            </Surface>
            <Surface variant="default" className="gap-4">
              <View className="gap-1">
                <AppText variant="sectionTitle">{t('skillsSearch')}</AppText>
                <AppText variant="bodySmall" tone="muted">
                  {t('skillsSearchHelp')}
                </AppText>
              </View>
              <View style={layout.isWeb ? { maxWidth: 540 } : undefined}>
                <SearchableSelect
                  label={t('skillsSearch')}
                  placeholder={t('skillsSearchPlaceholder')}
                  searchPlaceholder={t('skillsSearchPlaceholder')}
                  emptyMessage={t('skillsNoResults')}
                  options={skillOptions}
                  disabled={vm.save.isPending || remaining === 0}
                  loading={vm.isCatalogLoading}
                  onQueryChange={vm.setSearchInput}
                  onValueChange={(id) => {
                    const skill = vm.items.find((item) => item.id === id);
                    if (skill) vm.toggle(skill);
                  }}
                />
              </View>
              {vm.isInitialCatalogError ? (
                <View className="gap-2">
                  <AppText accessibilityLiveRegion="polite" tone="danger">
                    {t('skillsErrorMessage')}
                  </AppText>
                  <Button
                    label={t('retry')}
                    size="sm"
                    variant="ghost"
                    onPress={() => void vm.retryCatalog()}
                  />
                </View>
              ) : null}
              {vm.isIncrementalCatalogError ? (
                <View className="gap-2">
                  <AppText accessibilityLiveRegion="polite" tone="danger">
                    {t('skillsIncrementalError')}
                  </AppText>
                  <Button
                    label={t('retry')}
                    size="sm"
                    variant="ghost"
                    onPress={() => void vm.loadMore()}
                  />
                </View>
              ) : null}
            </Surface>
          </View>
        </View>
        {vm.save.isError ? (
          <AppText accessibilityLiveRegion="polite" tone="danger">
            {t('skillsSaveError')}
          </AppText>
        ) : null}
        <View
          className={layout.isWeb ? 'self-center' : undefined}
          style={layout.isWeb ? { alignSelf: 'center', width: 180 } : undefined}
        >
          <Button
            label={t('save')}
            fullWidth
            loading={vm.save.isPending}
            disabled={!vm.isDirty || vm.save.isPending}
            onPress={() => void save()}
          />
        </View>
      </View>
    </ScrollScreen>
  );
}

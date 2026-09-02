import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  AppText,
  Breadcrumbs,
  CollectionFeedback,
  IconButton,
  ScrollScreen,
  Surface,
  useResponsiveLayout,
} from '@palea/ui-native';
import { useLocale } from '@/core/localization/LocaleProvider';
import { ProfileRoleForm } from '../components/ProfileRoleForm';
import { toProfileLocale } from '../viewmodels/profileLocale';
import { useProfileRoleViewModel } from '../viewmodels/useProfileRoleViewModel';

export function ProfileRoleScreen() {
  const { t, i18n } = useLocale('profile');
  const router = useRouter();
  const layout = useResponsiveLayout();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timeout);
  }, [search]);
  const viewModel = useProfileRoleViewModel(
    toProfileLocale(i18n.language),
    debouncedSearch,
  );
  if (viewModel.isProfileLoading)
    return (
      <ScrollScreen keyboardAware>
        <CollectionFeedback status="loading" rows={3} />
      </ScrollScreen>
    );
  if (!viewModel.profile)
    return (
      <ScrollScreen keyboardAware>
        <CollectionFeedback
          status="error"
          title={t('errorTitle')}
          message={t('errorMessage')}
          actionLabel={t('retry')}
          onAction={() => void viewModel.refreshProfile()}
        />
      </ScrollScreen>
    );
  return (
    <ScrollScreen keyboardAware contentClassName="gap-6">
      <View
        className="w-full gap-6"
        style={
          layout.isWeb
            ? {
                alignSelf: 'center',
                maxWidth: layout.isExpanded ? 720 : 600,
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
              { label: t('roleEditTitle') },
            ]}
          />
        ) : null}
        <View className="gap-4">
          <IconButton
            icon="arrowBack"
            accessibilityLabel={t('back')}
            onPress={() => router.back()}
          />
          <View className="gap-1">
            <AppText variant="screenTitle">{t('roleEditTitle')}</AppText>
            <AppText tone="muted">{t('roleEditSubtitle')}</AppText>
          </View>
        </View>
        <Surface variant="default" className="gap-6">
          <ProfileRoleForm
            key={`${viewModel.profile.identity.id}-${i18n.language}`}
            role={viewModel.profile.role}
            viewModel={{ ...viewModel, search }}
            t={t}
            onSearchChange={setSearch}
          />
        </Surface>
      </View>
    </ScrollScreen>
  );
}

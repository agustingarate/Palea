import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppText, Button, Notice, Skeleton, Surface } from '@palea/ui-native';
import { useLocale } from '@/core/localization/LocaleProvider';
import { toProfileLocale } from '../viewmodels/profileLocale';
import { useProfileOverviewViewModel } from '../viewmodels/useProfileOverviewViewModel';

export function ProfileCompletionBanner() {
  const { t, i18n } = useLocale('profile');
  const router = useRouter();
  const vm = useProfileOverviewViewModel(toProfileLocale(i18n.language));
  if (vm.isLoading)
    return (
      <View className="px-4 pt-3">
        <Skeleton style={{ height: 72 }} />
      </View>
    );
  if (vm.error && !vm.profile)
    return (
      <View className="px-4 pt-3">
        <Surface variant="subtle" className="flex-row items-center gap-3">
          <AppText className="flex-1" tone="danger">
            {t('errorMessage')}
          </AppText>
          <Button
            label={t('retry')}
            size="sm"
            variant="ghost"
            onPress={() => void vm.refresh()}
          />
        </Surface>
      </View>
    );
  const section = vm.profile?.completion.nextSection;
  if (!section) return null;
  const target = {
    role: '/profile/role',
    experience: '/profile/experiences/new',
    skills: '/profile/skills',
  } as const;
  return (
    <View className="px-4 pt-3">
      <Surface
        variant="subtle"
        className="flex-row flex-wrap items-center gap-3"
      >
        <View className="min-w-56 flex-1">
          <Notice
            title={t('incompleteTitle')}
            message={t('incompleteMessage')}
            tone="warning"
          />
        </View>
        <Button
          label={t('incompleteCta')}
          size="sm"
          variant="secondary"
          onPress={() => router.push(target[section] as never)}
        />
      </Surface>
    </View>
  );
}

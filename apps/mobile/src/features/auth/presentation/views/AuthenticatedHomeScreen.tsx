import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { AppText, Button, FocusedFormLayout } from '@palea/ui-native';
import { useAuthSession } from '../providers/AuthProvider';
import { useDependency } from '@/core/di/DependenciesProvider';
import { dependencyTokens } from '@/core/di/dependencies';
import { useLocale } from '@/core/localization/LocaleProvider';

export function AuthenticatedHomeScreen() {
  const { t } = useLocale('auth');
  const { session, isRestoring } = useAuthSession();
  const auth = useDependency(dependencyTokens.authRepository);
  const onboarding = useDependency(dependencyTokens.onboardingRepository);
  const router = useRouter();
  const [notice, setNotice] = useState<string | null>(null);
  useEffect(() => {
    if (!isRestoring && !session) router.replace('/auth/login');
  }, [isRestoring, router, session]);
  useEffect(() => {
    if (!session) return;
    void onboarding.getAccount().then((account) => {
      if (account.missing.includes('personal')) {
        router.replace('/auth/personal-data');
        return;
      }
      if (account.missing.includes('profile')) {
        setNotice('Podés completar tu primer dato profesional cuando quieras.');
      }
    });
  }, [onboarding, router, session]);
  if (isRestoring || !session) return null;
  return <FocusedFormLayout title={t('loggedIn.title')}>
    {notice ? <AppText tone="muted">{notice}</AppText> : null}
    <Button label={t('logout')} variant="secondary" onPress={() => void auth.signOut()} />
  </FocusedFormLayout>;
}

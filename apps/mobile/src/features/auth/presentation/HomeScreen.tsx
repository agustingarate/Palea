import { useEffect } from 'react';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useDependency } from '@/core/di/DependenciesProvider';
import { dependencyTokens } from '@/core/di/dependencies';
import { useAuth } from './AuthProvider';
import { Action, AuthScaffold, ErrorMessage } from './components';
import { LoginScreen } from './LoginScreen';

export function HomeScreen() {
  const { t } = useTranslation();
  const auth = useAuth();
  const repository = useDependency(dependencyTokens.onboardingRepository);
  const profileQuery = useQuery({
    queryKey: ['account', auth.session?.user.id],
    queryFn: () => repository.me(),
    enabled: Boolean(auth.session),
  });
  const profile = profileQuery.data;
  useEffect(() => {
    if (profile?.missing.includes('personal'))
      router.replace('/auth/complete-profile');
  }, [profile]);
  if (auth.loading) return <AuthScaffold title="Palea" />;
  if (!auth.session) return <LoginScreen />;
  if (profile?.missing.includes('personal')) return null;
  return (
    <AuthScaffold title={t('auth.loggedIn')}>
      <ErrorMessage message={profileQuery.isError ? t('auth.error') : null} />
      {profile?.missing.length ? (
        <>
          <ErrorMessage message={t('auth.incomplete')} />
          <Action
            secondary
            label={t('auth.completeProfile')}
            onPress={() => router.push('/onboarding/profile')}
          />
        </>
      ) : null}
      <Action label={t('auth.logout')} onPress={() => void auth.signOut()} />
    </AuthScaffold>
  );
}

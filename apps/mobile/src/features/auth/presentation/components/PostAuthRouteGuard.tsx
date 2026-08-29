import type { PropsWithChildren } from 'react';
import { Redirect } from 'expo-router';
import { View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { AppText, Button, Screen, Spinner } from '@palea/ui-native';
import { useDependency } from '@/core/di/DependenciesProvider';
import { dependencyTokens } from '@/core/di/dependencies';
import { useLocale } from '@/core/localization/LocaleProvider';
import { useAuthSession } from '../providers/AuthProvider';
import { resolvePostAuthRoute } from '../navigation/resolvePostAuthRoute';

/** Protects authenticated surfaces until the account is complete enough to enter them. */
export function PostAuthRouteGuard({ children }: PropsWithChildren) {
  const { session, isRestoring } = useAuthSession();
  const onboarding = useDependency(dependencyTokens.onboardingRepository);
  const { t } = useLocale('auth');
  const account = useQuery({
    queryKey: ['account', 'me', session?.userId],
    queryFn: () => onboarding.getAccount(),
    enabled: !isRestoring && Boolean(session),
  });

  if (isRestoring || !session) {
    if (isRestoring) return null;
    return <Redirect href="/auth/login" />;
  }
  if (account.isPending)
    return (
      <Screen>
        <View className="flex-1 items-center justify-center gap-3 px-6">
          <Spinner label={t('route.loading')} />
        </View>
      </Screen>
    );
  if (account.isError)
    return (
      <Screen>
        <View className="flex-1 items-center justify-center gap-3 px-6">
          <AppText tone="danger">{t('route.error')}</AppText>
          <Button
            label={t('route.retry')}
            onPress={() => void account.refetch()}
          />
        </View>
      </Screen>
    );

  const destination = resolvePostAuthRoute(account.data);
  if (destination !== '/') return <Redirect href={destination} />;
  return children;
}

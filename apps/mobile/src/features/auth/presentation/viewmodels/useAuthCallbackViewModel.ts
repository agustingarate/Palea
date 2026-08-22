import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useDependency } from '@/core/di/DependenciesProvider';
import { dependencyTokens } from '@/core/di/dependencies';
import { resolvePostAuthRoute } from '../navigation/resolvePostAuthRoute';

export function useAuthCallbackViewModel() {
  const params = useLocalSearchParams<{ code?: string }>();
  const router = useRouter();
  const auth = useDependency(dependencyTokens.authRepository);
  const onboarding = useDependency(dependencyTokens.onboardingRepository);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { void (async () => {
    try {
      if (!params.code) throw new Error('OAuth callback did not include a code.');
      await auth.exchangeOAuthCode(params.code);
      router.replace(resolvePostAuthRoute(await onboarding.getAccount()));
    } catch { setError('No pudimos completar el inicio de sesión. Volvé a intentarlo.'); }
  })(); }, [auth, onboarding, params.code, router]);
  return { error };
}

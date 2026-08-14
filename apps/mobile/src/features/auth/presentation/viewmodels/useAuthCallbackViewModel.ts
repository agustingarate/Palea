import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useDependency } from '@/core/di/DependenciesProvider';
import { dependencyTokens } from '@/core/di/dependencies';

export function useAuthCallbackViewModel() {
  const params = useLocalSearchParams<{ code?: string }>(); const router = useRouter();
  const auth = useDependency(dependencyTokens.authRepository); const onboarding = useDependency(dependencyTokens.onboardingRepository);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { void (async () => {
    try {
      if (params.code) await auth.exchangeOAuthCode(params.code);
      const account = await onboarding.getAccount();
      router.replace(account.missing.includes('personal') ? '/auth/personal-data' : '/');
    } catch { setError('No pudimos completar el inicio de sesión. Volvé a intentarlo.'); }
  })(); }, [auth, onboarding, params.code, router]);
  return { error };
}

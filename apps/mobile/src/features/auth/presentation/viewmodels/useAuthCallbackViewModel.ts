import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useDependency } from '@/core/di/DependenciesProvider';
import { dependencyTokens } from '@/core/di/dependencies';

export function useAuthCallbackViewModel() {
  const params = useLocalSearchParams<{ code?: string }>();
  const router = useRouter();
  const auth = useDependency(dependencyTokens.authRepository);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { void (async () => {
    try {
      if (params.code) await auth.exchangeOAuthCode(params.code);
      router.replace('/');
    } catch { setError('No pudimos completar el inicio de sesión. Volvé a intentarlo.'); }
  })(); }, [auth, params.code, router]);
  return { error };
}
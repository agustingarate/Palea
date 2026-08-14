import { useEffect } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { useDependency } from '@/core/di/DependenciesProvider';
import { dependencyTokens } from '@/core/di/dependencies';
import { AuthScaffold } from '@/features/auth/presentation/components';

export default function AuthCallback() {
  const { code } = useLocalSearchParams<{ code?: string }>();
  const auth = useDependency(dependencyTokens.authRepository);
  useEffect(() => {
    if (code) void auth.exchangeCode(code).then(() => router.replace('/'));
  }, [auth, code]);
  return <AuthScaffold title="Palea" />;
}

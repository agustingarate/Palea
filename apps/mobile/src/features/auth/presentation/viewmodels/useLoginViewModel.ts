import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useDependency } from '@/core/di/DependenciesProvider';
import { dependencyTokens } from '@/core/di/dependencies';

export function useLoginViewModel() {
  const auth = useDependency(dependencyTokens.authRepository);
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);
  const login = async (email: string, password: string) => {
    setError(null); setSubmitting(true);
    try { await auth.signIn({ email, password }); router.replace('/'); }
    catch { setError('No pudimos iniciar sesión. Revisá tus datos e intentá nuevamente.'); }
    finally { setSubmitting(false); }
  };
  const socialLogin = async (provider: 'google' | 'linkedin_oidc') => {
    setError(null); setSubmitting(true);
    try { await auth.signInWithSocial(provider); }
    catch { setError('No pudimos completar el inicio de sesión social.'); }
    finally { setSubmitting(false); }
  };
  return { error, isSubmitting, login, socialLogin };
}
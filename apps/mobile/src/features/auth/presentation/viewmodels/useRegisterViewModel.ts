import { useState } from 'react';
import { useRouter } from 'expo-router';
import type { RegistrationInput } from '@palea/contracts';
import { RegisterAccount } from '../../domain/usecases/RegisterAccount';
import { useDependency } from '@/core/di/DependenciesProvider';
import { dependencyTokens } from '@/core/di/dependencies';

export function useRegisterViewModel() {
  const auth = useDependency(dependencyTokens.authRepository);
  const onboarding = useDependency(dependencyTokens.onboardingRepository);
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);
  const register = async (input: RegistrationInput) => {
    setError(null); setSubmitting(true);
    try {
      await new RegisterAccount(auth, onboarding).execute(input);
      router.replace('/onboarding/profile');
    } catch {
      setError('No pudimos crear tu cuenta. Si tu cuenta fue creada, iniciá sesión y reintentá tus datos personales.');
    } finally { setSubmitting(false); }
  };
  return { error, isSubmitting, register };
}

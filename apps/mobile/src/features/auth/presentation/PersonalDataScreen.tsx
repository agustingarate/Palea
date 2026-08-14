import { useState } from 'react';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { completeRegistrationInputSchema } from '@palea/contracts';
import { useDependency } from '@/core/di/DependenciesProvider';
import { dependencyTokens } from '@/core/di/dependencies';
import {
  Action,
  AuthScaffold,
  CountrySelector,
  ErrorMessage,
  Field,
} from './components';

export function PersonalDataScreen() {
  const { t, i18n } = useTranslation();
  const repository = useDependency(dependencyTokens.onboardingRepository);
  const [fullName, setFullName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [nationality, setNationality] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const submit = async () => {
    const parsed = completeRegistrationInputSchema.safeParse({
      fullName,
      birthDate,
      nationality: nationality.toUpperCase(),
    });
    if (!parsed.success) return setError(t('auth.error'));
    setLoading(true);
    try {
      await repository.completeRegistration(parsed.data);
      router.replace('/onboarding/profile');
    } catch {
      setError(t('auth.error'));
    } finally {
      setLoading(false);
    }
  };
  return (
    <AuthScaffold title={t('auth.registerTitle')}>
      <Field
        label={t('auth.fullName')}
        value={fullName}
        onChangeText={setFullName}
      />
      <Field
        label={t('auth.birthDate')}
        value={birthDate}
        onChangeText={setBirthDate}
        placeholder="1990-01-31"
      />
      <CountrySelector
        label={t('auth.nationality')}
        locale={i18n.language}
        onSelect={setNationality}
      />
      <ErrorMessage message={error} />
      <Action
        label={t('auth.continue')}
        loading={loading}
        onPress={() => void submit()}
      />
    </AuthScaffold>
  );
}

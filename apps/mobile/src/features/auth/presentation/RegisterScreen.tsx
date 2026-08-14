import { useState } from 'react';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  completeRegistrationInputSchema,
  passwordSchema,
} from '@palea/contracts';
import { useDependency } from '@/core/di/DependenciesProvider';
import { dependencyTokens } from '@/core/di/dependencies';
import { useAuth } from './AuthProvider';
import {
  Action,
  AuthScaffold,
  CountrySelector,
  ErrorMessage,
  Field,
} from './components';

export function RegisterScreen() {
  const { t, i18n } = useTranslation();
  const auth = useAuth();
  const onboarding = useDependency(dependencyTokens.onboardingRepository);
  const [values, setValues] = useState({
    fullName: '',
    email: '',
    password: '',
    repeatPassword: '',
    birthDate: '',
    nationality: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const update = (key: keyof typeof values) => (value: string) =>
    setValues((current) => ({ ...current, [key]: value }));
  const submit = async () => {
    setError(null);
    const registration = completeRegistrationInputSchema.safeParse({
      fullName: values.fullName,
      birthDate: values.birthDate,
      nationality: values.nationality,
    });
    if (
      !registration.success ||
      !passwordSchema.safeParse(values.password).success ||
      values.password !== values.repeatPassword ||
      !isAdult(values.birthDate)
    ) {
      setError(t('auth.error'));
      return;
    }
    setLoading(true);
    try {
      await auth.signUp({
        email: values.email.trim(),
        password: values.password,
        fullName: registration.data.fullName,
      });
      await onboarding.completeRegistration(registration.data);
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
        value={values.fullName}
        onChangeText={update('fullName')}
        autoComplete="name"
      />
      <Field
        label={t('auth.email')}
        value={values.email}
        onChangeText={update('email')}
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
      />
      <Field
        label={t('auth.password')}
        value={values.password}
        onChangeText={update('password')}
        secureTextEntry
        autoComplete="new-password"
      />
      <Field
        label={t('auth.repeatPassword')}
        value={values.repeatPassword}
        onChangeText={update('repeatPassword')}
        secureTextEntry
      />
      <Field
        label={t('auth.birthDate')}
        value={values.birthDate}
        onChangeText={update('birthDate')}
        placeholder="1990-01-31"
      />
      <CountrySelector
        label={t('auth.nationality')}
        locale={i18n.language}
        onSelect={update('nationality')}
      />
      <ErrorMessage message={error} />
      <Action
        label={t('auth.register')}
        loading={loading}
        onPress={() => void submit()}
      />
      <Action
        secondary
        label={t('auth.haveAccount')}
        onPress={() => router.back()}
      />
    </AuthScaffold>
  );
}

function isAdult(value: string) {
  const birth = new Date(`${value}T00:00:00Z`);
  const threshold = new Date();
  threshold.setUTCFullYear(threshold.getUTCFullYear() - 18);
  return !Number.isNaN(birth.valueOf()) && birth <= threshold;
}

import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { environment } from '@/core/config/environment';
import { useAuth } from './AuthProvider';
import { Action, AuthScaffold, ErrorMessage, Field } from './components';

export function LoginScreen() {
  const { t } = useTranslation();
  const auth = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const run = async (action: () => Promise<void>) => {
    setLoading(true);
    setError(null);
    try {
      await action();
      router.replace('/');
    } catch {
      setError(t('auth.error'));
    } finally {
      setLoading(false);
    }
  };
  return (
    <AuthScaffold title={t('auth.loginTitle')}>
      <Field
        label={t('auth.email')}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
      />
      <Field
        label={t('auth.password')}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="current-password"
      />
      <ErrorMessage message={error} />
      <Action
        label={t('auth.login')}
        loading={loading}
        disabled={!email || !password}
        onPress={() => void run(() => auth.signIn(email.trim(), password))}
      />
      <View style={{ gap: 8 }}>
        {environment.authProviders.includes('google') ? (
          <Action
            secondary
            label={t('auth.google')}
            onPress={() => void run(() => auth.signInWithSocial('google'))}
          />
        ) : null}
        {environment.authProviders.includes('linkedin_oidc') ? (
          <Action
            secondary
            label={t('auth.linkedin')}
            onPress={() =>
              void run(() => auth.signInWithSocial('linkedin_oidc'))
            }
          />
        ) : null}
      </View>
      <Action
        secondary
        label={t('auth.createAccount')}
        onPress={() => router.push('/auth/register')}
      />
    </AuthScaffold>
  );
}

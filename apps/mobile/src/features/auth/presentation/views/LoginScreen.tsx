import { useForm } from '@tanstack/react-form';
import { Link, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import {
  AppText,
  Button,
  Icon,
  PasswordField,
  TextField,
} from '@palea/ui-native';
import { z } from 'zod';
import { AuthFormLayout } from '../components/AuthFormLayout';
import { formatFieldError } from '../formatFieldError';
import { useLoginViewModel } from '../viewmodels/useLoginViewModel';
import { useLocale } from '@/core/localization/LocaleProvider';

const schema = z.object({
  email: z.email('Ingresá un email válido.'),
  password: z.string().min(1, 'Ingresá tu contraseña.'),
});
export function LoginScreen() {
  const { t } = useLocale('auth');
  const vm = useLoginViewModel();
  const { notice } = useLocalSearchParams<{ notice?: string }>();
  const form = useForm({
    defaultValues: { email: '', password: '' },
    validators: { onSubmit: schema },
    onSubmit: async ({ value }) => vm.login(value.email, value.password),
  });
  return (
    <AuthFormLayout
      title={t('login.title')}
      description={t('login.description')}
      contained
    >
      <form.Field name="email">
        {(field) => (
          <TextField
            label={t('field.email')}
            leading={<Icon name="mail" size="sm" tone="muted" />}
            required
            placeholder="nombre@ejemplo.com"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            value={field.state.value}
            onChangeText={field.handleChange}
            onBlur={field.handleBlur}
            error={formatFieldError(field.state.meta.errors)}
          />
        )}
      </form.Field>
      <form.Field name="password">
        {(field) => (
          <PasswordField
            label={t('field.password')}
            leading={<Icon name="lock" size="sm" tone="muted" />}
            required
            placeholder="Ingresá tu contraseña"
            autoComplete="current-password"
            value={field.state.value}
            onChangeText={field.handleChange}
            onBlur={field.handleBlur}
            error={formatFieldError(field.state.meta.errors)}
          />
        )}
      </form.Field>
      {notice === 'onboarding-auth' ? (
        <AppText tone="info">
          Iniciá sesión para continuar con el onboarding.
        </AppText>
      ) : null}
      {vm.error ? <AppText tone="danger">{vm.error}</AppText> : null}
      <form.Subscribe selector={(state) => state.canSubmit}>
        {(canSubmit) => (
          <Button
            label={t('login.submit')}
            fullWidth
            loading={vm.isSubmitting}
            disabled={!canSubmit}
            onPress={() => form.handleSubmit()}
          />
        )}
      </form.Subscribe>
      <View className="gap-2">
        <Button
          label="Continuar con Google"
          variant="secondary"
          fullWidth
          disabled={vm.isSubmitting}
          onPress={() => vm.socialLogin('google')}
        />
        <Button
          label="Continuar con LinkedIn"
          variant="secondary"
          fullWidth
          disabled={vm.isSubmitting}
          onPress={() => vm.socialLogin('linkedin_oidc')}
        />
      </View>
      <View className="flex-row items-center justify-center gap-1">
        <AppText tone="muted">¿No tenés cuenta?</AppText>
        <Link href="/auth/register">
          <AppText tone="interaction">Registrate</AppText>
        </Link>
      </View>
    </AuthFormLayout>
  );
}

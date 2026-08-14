import { useForm } from '@tanstack/react-form';
import { Link } from 'expo-router';
import { AppText, Button, PasswordField, TextField } from '@palea/ui-native';
import { registrationInputSchema, isAtLeastAge } from '@palea/contracts';
import { AuthFormLayout } from '../components/AuthFormLayout';
import { useRegisterViewModel } from '../viewmodels/useRegisterViewModel';
import { useLocale } from '@/core/localization/LocaleProvider';

export function RegisterScreen() {
  const { t } = useLocale('auth');
  const vm = useRegisterViewModel();
  const form = useForm({
    defaultValues: { fullName: '', email: '', password: '', repeatPassword: '', birthDate: '', nationality: '' },
    validators: { onSubmit: registrationInputSchema.superRefine((value, context) => { if (!isAtLeastAge(value.birthDate, 18)) context.addIssue({ code: 'custom', path: ['birthDate'], message: 'Debés tener al menos 18 años.' }); }) },
    onSubmit: async ({ value }) => vm.register(value),
  });
  return <AuthFormLayout title={t('register.title')} description={t('register.description')}>
    <form.Field name="fullName">{(field) => <TextField label={t('field.fullName')} required autoComplete="name" value={field.state.value} onChangeText={field.handleChange} onBlur={field.handleBlur} error={field.state.meta.errors.map(String).join(' ')} />}</form.Field>
    <form.Field name="email">{(field) => <TextField label={t('field.email')} required autoCapitalize="none" autoComplete="email" keyboardType="email-address" value={field.state.value} onChangeText={field.handleChange} onBlur={field.handleBlur} error={field.state.meta.errors.map(String).join(' ')} />}</form.Field>
    <form.Field name="password">{(field) => <PasswordField label={t('field.password')} helperText="Mínimo 8 caracteres, una mayúscula, una minúscula y un número." required autoComplete="new-password" value={field.state.value} onChangeText={field.handleChange} onBlur={field.handleBlur} error={field.state.meta.errors.map(String).join(' ')} />}</form.Field>
    <form.Field name="repeatPassword">{(field) => <PasswordField label="Repetí tu contraseña" required autoComplete="new-password" value={field.state.value} onChangeText={field.handleChange} onBlur={field.handleBlur} error={field.state.meta.errors.map(String).join(' ')} />}</form.Field>
    <form.Field name="birthDate">{(field) => <TextField label={t('field.birthDate')} required placeholder="AAAA-MM-DD" autoComplete="birthdate-full" value={field.state.value} onChangeText={field.handleChange} onBlur={field.handleBlur} error={field.state.meta.errors.map(String).join(' ')} />}</form.Field>
    <form.Field name="nationality">{(field) => <TextField label={t('field.nationality')} required placeholder="AR" autoCapitalize="characters" maxLength={2} value={field.state.value} onChangeText={(value) => field.handleChange(value.toUpperCase())} onBlur={field.handleBlur} error={field.state.meta.errors.map(String).join(' ')} />}</form.Field>
    {vm.error ? <AppText tone="danger">{vm.error}</AppText> : null}
    <form.Subscribe selector={(state) => state.canSubmit}>{(canSubmit) => <Button label={t('register.submit')} fullWidth loading={vm.isSubmitting} disabled={!canSubmit} onPress={() => form.handleSubmit()} />}</form.Subscribe>
    <Link href="/auth/login"><AppText tone="interaction">¿Ya tenés cuenta? Iniciá sesión</AppText></Link>
  </AuthFormLayout>;
}

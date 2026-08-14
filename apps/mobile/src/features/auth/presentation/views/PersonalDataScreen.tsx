import { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { completeRegistrationInputSchema, isAtLeastAge } from '@palea/contracts';
import { useRouter } from 'expo-router';
import { AppText, Button, FocusedFormLayout, TextField } from '@palea/ui-native';
import { useDependency } from '@/core/di/DependenciesProvider';
import { dependencyTokens } from '@/core/di/dependencies';
export function PersonalDataScreen() {
  const repository = useDependency(dependencyTokens.onboardingRepository); const router = useRouter(); const [error, setError] = useState<string | null>(null);
  const form = useForm({ defaultValues: { fullName: '', birthDate: '', nationality: '' }, validators: { onSubmit: completeRegistrationInputSchema.superRefine((value, context) => { if (!isAtLeastAge(value.birthDate, 18)) context.addIssue({ code: 'custom', path: ['birthDate'], message: 'Debés tener al menos 18 años.' }); }) }, onSubmit: async ({ value }) => { try { await repository.completeRegistration(value); router.replace('/onboarding/profile'); } catch { setError('No pudimos guardar tus datos.'); } } });
  return <FocusedFormLayout title="Completá tus datos" description="Necesitamos estos datos para crear tu perfil."><form.Field name="fullName">{(field) => <TextField label="Nombre completo" required value={field.state.value} onChangeText={field.handleChange} onBlur={field.handleBlur} error={field.state.meta.errors.map(String).join(' ')} />}</form.Field><form.Field name="birthDate">{(field) => <TextField label="Fecha de nacimiento" required placeholder="AAAA-MM-DD" value={field.state.value} onChangeText={field.handleChange} onBlur={field.handleBlur} error={field.state.meta.errors.map(String).join(' ')} />}</form.Field><form.Field name="nationality">{(field) => <TextField label="Nacionalidad (ISO)" required placeholder="AR" maxLength={2} autoCapitalize="characters" value={field.state.value} onChangeText={(value) => field.handleChange(value.toUpperCase())} onBlur={field.handleBlur} error={field.state.meta.errors.map(String).join(' ')} />}</form.Field>{error ? <AppText tone="danger">{error}</AppText> : null}<form.Subscribe selector={(state) => state.canSubmit}>{(canSubmit) => <Button label="Continuar" fullWidth disabled={!canSubmit} onPress={() => form.handleSubmit()} />}</form.Subscribe></FocusedFormLayout>;
}

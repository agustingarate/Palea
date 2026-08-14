import { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { saveWorkExperienceInputSchema } from '@palea/contracts';
import { AppText, Button, Checkbox, TextField } from '@palea/ui-native';
import { useRouter } from 'expo-router';
import { AuthFormLayout } from '../../components/AuthFormLayout';
import { useOnboardingViewModel } from '../viewmodels/useOnboardingViewModel';
export function WorkOnboardingScreen() {
  const vm = useOnboardingViewModel(); const router = useRouter(); const [error, setError] = useState<string | null>(null);
  const form = useForm({ defaultValues: vm.work, validators: { onSubmit: saveWorkExperienceInputSchema }, onSubmit: async ({ value }) => { vm.setWork(value); try { await vm.saveWork(); } catch { setError('No pudimos guardar este paso.'); } } });
  return <AuthFormLayout title="Experiencia laboral" description="Agregá una experiencia inicial si querés." currentStep={2} onBack={() => router.back()}>
    <form.Field name="companyName">{(field) => <TextField label="Empresa" required value={field.state.value} onChangeText={field.handleChange} onBlur={field.handleBlur} error={field.state.meta.errors.map(String).join(' ')} />}</form.Field>
    <form.Field name="role">{(field) => <TextField label="Puesto" required value={field.state.value} onChangeText={field.handleChange} onBlur={field.handleBlur} error={field.state.meta.errors.map(String).join(' ')} />}</form.Field>
    <form.Field name="startedOn">{(field) => <TextField label="Inicio" placeholder="AAAA-MM-DD" required value={field.state.value} onChangeText={field.handleChange} onBlur={field.handleBlur} error={field.state.meta.errors.map(String).join(' ')} />}</form.Field>
    <form.Field name="isCurrent">{(field) => <Checkbox label="Actualmente trabajo aquí" checked={field.state.value} onChange={field.handleChange} />}</form.Field>
    <form.Field name="endedOn">{(field) => <TextField label="Fin" placeholder="AAAA-MM-DD" value={field.state.value ?? ''} onChangeText={(value) => field.handleChange(value || null)} onBlur={field.handleBlur} error={field.state.meta.errors.map(String).join(' ')} />}</form.Field>
    {error ? <AppText tone="danger">{error}</AppText> : null}<form.Subscribe selector={(state) => state.canSubmit}>{(canSubmit) => <Button label="Continuar" fullWidth disabled={!canSubmit} onPress={() => form.handleSubmit()} />}</form.Subscribe>
  </AuthFormLayout>;
}

import { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { saveProfileInputSchema, type ExperienceBand } from '@palea/contracts';
import { AppText, Button, Checkbox, SegmentedControl, TextAreaField } from '@palea/ui-native';
import { AuthFormLayout } from '../../components/AuthFormLayout';
import { useOnboardingViewModel } from '../viewmodels/useOnboardingViewModel';

const bands = [{ value: 'zero_to_one', label: '0–1' }, { value: 'two_to_four', label: '2–4' }, { value: 'five_to_eight', label: '5–8' }, { value: 'over_eight', label: '8+' }];
export function ProfileOnboardingScreen() {
  const vm = useOnboardingViewModel(); const [error, setError] = useState<string | null>(null);
  const form = useForm({ defaultValues: vm.profile, validators: { onSubmit: saveProfileInputSchema }, onSubmit: async ({ value }) => { vm.setProfile(value); try { await vm.saveProfile(); } catch { setError('No pudimos guardar este paso.'); } } });
  const interests = vm.catalog.data?.interests ?? [];
  return <AuthFormLayout title="Tu perfil profesional" description="Este paso es opcional; podés completarlo después." currentStep={1}>
    <form.Field name="roleDescription">{(field) => <TextAreaField label="Rol o especialidad" required value={field.state.value} onChangeText={field.handleChange} onBlur={field.handleBlur} error={field.state.meta.errors.map(String).join(' ')} />}</form.Field>
    <form.Field name="experienceBand">{(field) => <SegmentedControl label="Experiencia" items={bands} value={field.state.value} onValueChange={(value) => field.handleChange(value as ExperienceBand)} />}</form.Field>
    <form.Field name="interestIds">{(field) => <><AppText variant="label">Intereses (máximo 3)</AppText>{interests.map((item) => <Checkbox key={item.id} label={item.label} checked={field.state.value.includes(item.id)} onChange={(checked) => field.handleChange(checked ? [...field.state.value, item.id].slice(0, 3) : field.state.value.filter((id) => id !== item.id))} />)}</>}</form.Field>
    {error ? <AppText tone="danger">{error}</AppText> : null}
    <form.Subscribe selector={(state) => state.canSubmit}>{(canSubmit) => <Button label="Continuar" fullWidth disabled={!canSubmit} onPress={() => form.handleSubmit()} />}</form.Subscribe>
    <Button label="Omitir onboarding" variant="ghost" fullWidth onPress={() => void vm.finish(true)} />
  </AuthFormLayout>;
}

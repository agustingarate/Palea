import { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { saveProfileInputSchema, type ExperienceBand } from '@palea/contracts';
import {
  AppText,
  Button,
  Chip,
  SegmentedControl,
  TextField,
} from '@palea/ui-native';
import { View } from 'react-native';
import { AuthFormLayout } from '../../components/AuthFormLayout';
import { formatFieldError } from '../../formatFieldError';
import { useOnboardingViewModel } from '../viewmodels/useOnboardingViewModel';

const bands = [
  { value: 'zero_to_one', label: '0 a 1 año' },
  { value: 'two_to_four', label: '2 a 4 años' },
  { value: 'five_to_eight', label: '5 a 8 años' },
  { value: 'over_eight', label: 'Más de 8' },
];

export function ProfileOnboardingScreen() {
  const vm = useOnboardingViewModel();
  const [error, setError] = useState<string | null>(null);
  const form = useForm({
    defaultValues: vm.profile,
    validators: { onSubmit: saveProfileInputSchema },
    onSubmit: async ({ value }) => {
      setError(null);
      try {
        await vm.saveProfile(value);
      } catch {
        setError('No pudimos guardar este paso.');
      }
    },
  });
  const interests = vm.catalog.data?.interests ?? [];
  return (
    <AuthFormLayout
      title="Tu perfil profesional"
      description="Este paso es opcional; podés completarlo después."
      currentStep={1}
    >
      <form.Field name="roleDescription">
        {(field) => (
          <TextField
            label="Rol o especialidad"
            required
            placeholder="Ej.: Diseñadora de producto"
            value={field.state.value}
            onChangeText={field.handleChange}
            onBlur={field.handleBlur}
            error={formatFieldError(field.state.meta.errors)}
          />
        )}
      </form.Field>
      <form.Field name="experienceBand">
        {(field) => (
          <SegmentedControl
            label="Años de experiencia profesional"
            items={bands}
            value={field.state.value}
            onValueChange={(value) =>
              field.handleChange(value as ExperienceBand)
            }
          />
        )}
      </form.Field>
      <form.Field name="interestIds">
        {(field) => (
          <View className="gap-2">
            <AppText variant="label">Intereses (máximo 3)</AppText>
            <View className="flex-row flex-wrap gap-2">
              {interests.map((item) => (
                <Chip
                  key={item.id}
                  label={item.label}
                  selected={field.state.value.includes(item.id)}
                  onPress={() =>
                    field.handleChange(
                      field.state.value.includes(item.id)
                        ? field.state.value.filter((id) => id !== item.id)
                        : [...field.state.value, item.id].slice(0, 3),
                    )
                  }
                />
              ))}
            </View>
          </View>
        )}
      </form.Field>
      {error ? <AppText tone="danger">{error}</AppText> : null}
      <form.Subscribe selector={(state) => state.canSubmit}>
        {(canSubmit) => (
          <Button
            label="Continuar"
            fullWidth
            disabled={!canSubmit}
            onPress={() => form.handleSubmit()}
          />
        )}
      </form.Subscribe>
      <Button
        label="Omitir este paso"
        variant="ghost"
        fullWidth
        onPress={vm.skipProfile}
      />
    </AuthFormLayout>
  );
}

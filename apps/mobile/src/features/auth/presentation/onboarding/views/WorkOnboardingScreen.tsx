import { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { saveWorkExperienceInputSchema } from '@palea/contracts';
import {
  AppText,
  Button,
  Checkbox,
  TextField,
  useResponsiveLayout,
} from '@palea/ui-native';
import { useRouter } from 'expo-router';
import { View } from 'react-native';
import {
  createAnimatedComponent,
  FadeIn,
  FadeOut,
  ReduceMotion,
} from 'react-native-reanimated';
import { AuthFormLayout } from '../../components/AuthFormLayout';
import { formatFieldError } from '../../formatFieldError';
import { useOnboardingViewModel } from '../viewmodels/useOnboardingViewModel';

const AnimatedView = createAnimatedComponent(View);

export function WorkOnboardingScreen() {
  const vm = useOnboardingViewModel();
  const router = useRouter();
  const layout = useResponsiveLayout();
  const [error, setError] = useState<string | null>(null);
  const actionStyle =
    layout.isWeb && !layout.isCompact ? undefined : { flex: 1 };
  const form = useForm({
    defaultValues: vm.work,
    validators: { onSubmit: saveWorkExperienceInputSchema },
    onSubmit: async ({ value }) => {
      setError(null);
      try {
        await vm.saveWork(value);
      } catch {
        setError('No pudimos guardar este paso.');
      }
    },
  });
  return (
    <AuthFormLayout
      title="Experiencia laboral"
      description="Agregá una experiencia inicial si querés."
      currentStep={2}
    >
      <form.Field name="companyName">
        {(field) => (
          <TextField
            label="Empresa"
            required
            placeholder="Ej.: Palea"
            value={field.state.value}
            onChangeText={field.handleChange}
            onBlur={field.handleBlur}
            error={formatFieldError(field.state.meta.errors)}
          />
        )}
      </form.Field>
      <form.Field name="role">
        {(field) => (
          <TextField
            label="Puesto"
            required
            placeholder="Ej.: Product Designer"
            value={field.state.value}
            onChangeText={field.handleChange}
            onBlur={field.handleBlur}
            error={formatFieldError(field.state.meta.errors)}
          />
        )}
      </form.Field>
      <form.Field name="isCurrent">
        {(field) => (
          <Checkbox
            label="Actualmente trabajo aquí"
            checked={field.state.value}
            onChange={(checked) => {
              field.handleChange(checked);
              if (checked) form.setFieldValue('endedOn', null);
            }}
          />
        )}
      </form.Field>
      <form.Subscribe selector={(state) => state.values.isCurrent}>
        {(isCurrent) => (
          <View
            style={{
              flexDirection: layout.isCompact ? 'column' : 'row',
              gap: 16,
            }}
          >
            <View style={{ flex: 1 }}>
              <form.Field name="startedOn">
                {(field) => (
                  <TextField
                    label="Fecha de inicio"
                    placeholder="AAAA-MM-DD"
                    required
                    value={field.state.value}
                    onChangeText={field.handleChange}
                    onBlur={field.handleBlur}
                    error={formatFieldError(field.state.meta.errors)}
                  />
                )}
              </form.Field>
            </View>
            {!isCurrent ? (
              <AnimatedView
                entering={FadeIn.duration(180).reduceMotion(
                  ReduceMotion.System,
                )}
                exiting={FadeOut.duration(140).reduceMotion(
                  ReduceMotion.System,
                )}
                style={{ flex: 1 }}
              >
                <form.Field name="endedOn">
                  {(field) => (
                    <TextField
                      label="Fecha de fin"
                      placeholder="AAAA-MM-DD"
                      value={field.state.value ?? ''}
                      onChangeText={(value) =>
                        field.handleChange(value || null)
                      }
                      onBlur={field.handleBlur}
                      error={formatFieldError(field.state.meta.errors)}
                    />
                  )}
                </form.Field>
              </AnimatedView>
            ) : null}
          </View>
        )}
      </form.Subscribe>
      {error ? <AppText tone="danger">{error}</AppText> : null}
      <View className="flex-row justify-start gap-3">
        <Button
          label="Volver"
          variant="ghost"
          leadingIcon="arrowBack"
          style={actionStyle}
          onPress={() => router.back()}
        />
        <form.Subscribe selector={(state) => state.canSubmit}>
          {(canSubmit) => (
            <Button
              label="Continuar"
              style={actionStyle}
              disabled={!canSubmit}
              onPress={() => form.handleSubmit()}
            />
          )}
        </form.Subscribe>
      </View>
      <Button
        label="Omitir este paso"
        variant="ghost"
        fullWidth
        onPress={() => router.push('/onboarding/skills')}
      />
    </AuthFormLayout>
  );
}

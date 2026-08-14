import type { ReactNode } from 'react';
import { View } from 'react-native';
import { Button, FocusedFormLayout, StepProgress } from '@palea/ui-native';

export function AuthFormLayout({ title, description, children, currentStep, onBack }: { title: string; description?: string; children: ReactNode; currentStep?: number; onBack?: () => void }) {
  return <FocusedFormLayout title={title} description={description} keyboardAware progress={currentStep ? <StepProgress current={currentStep} total={3} title="Onboarding" stepLabel={`Paso ${currentStep} de 3`} /> : undefined}>
    {onBack ? <Button label="Volver" variant="ghost" leadingIcon="arrowBack" onPress={onBack} /> : null}
    <View className="gap-4">{children}</View>
  </FocusedFormLayout>;
}

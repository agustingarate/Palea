import type { ReactNode } from 'react';
import { View } from 'react-native';
import { FocusedFormLayout, StepProgress, Surface } from '@palea/ui-native';

export function AuthFormLayout({
  title,
  description,
  children,
  currentStep,
  contained = false,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  currentStep?: number;
  contained?: boolean;
}) {
  const content = <View className="gap-4">{children}</View>;
  return (
    <FocusedFormLayout
      title={title}
      description={description}
      keyboardAware
      progress={
        currentStep ? (
          <StepProgress
            current={currentStep}
            total={3}
            title="Onboarding"
            stepLabel={`Paso ${currentStep} de 3`}
          />
        ) : undefined
      }
    >
      {contained ? (
        <Surface variant="elevated" padding="lg">
          {content}
        </Surface>
      ) : (
        content
      )}
    </FocusedFormLayout>
  );
}

import { View } from 'react-native';
import { AppText } from '../atoms/AppText';
import { ProgressIndicator } from './Selection';

export interface StepProgressProps {
  current: number;
  total: number;
  stepLabel: string;
  title?: string;
}

/**
 * Composes the shared progress primitive with the visible context required by
 * multi-step flows. Navigation and state deliberately remain outside UI.
 */
export function StepProgress({
  current,
  total,
  stepLabel,
  title,
}: StepProgressProps) {
  return (
    <View className="gap-2">
      <View className="flex-row items-baseline justify-between gap-3">
        {title ? <AppText variant="label">{title}</AppText> : <View />}
        <AppText variant="label" tone="muted">
          {stepLabel}
        </AppText>
      </View>
      <ProgressIndicator current={current} total={total} />
    </View>
  );
}

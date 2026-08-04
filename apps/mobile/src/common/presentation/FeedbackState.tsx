import { View } from 'react-native';
import { AppText, Button } from '@palea/ui-native';

export interface FeedbackStateProps {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function FeedbackState({
  title,
  message,
  actionLabel,
  onAction,
}: FeedbackStateProps) {
  return (
    <View
      className="flex-1 items-center justify-center gap-3 px-8"
      accessibilityRole="summary"
    >
      <AppText variant="title" className="text-center">
        {title}
      </AppText>
      <AppText muted className="text-center">
        {message}
      </AppText>
      {actionLabel && onAction ? (
        <Button label={actionLabel} onPress={onAction} />
      ) : null}
    </View>
  );
}

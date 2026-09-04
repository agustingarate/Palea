import { Pressable, View } from 'react-native';
import { AppText, Icon } from '@palea/ui-native';

interface JobDescriptionImageImportCardProps {
  title: string;
  description: string;
  disabled?: boolean;
  onSelectImage(): void;
}

/** Native platforms delegate selection to the system image picker. */
export function JobDescriptionImageImportCard({
  title,
  description,
  disabled,
  onSelectImage,
}: JobDescriptionImageImportCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={description}
      disabled={disabled}
      onPress={onSelectImage}
      className="min-h-36 items-center justify-center rounded-lg border border-dashed border-border bg-surface-subtle px-5 py-6 dark:border-dark-border dark:bg-dark-surface-subtle"
    >
      <View className="items-center gap-2">
        <Icon name="upload" size="lg" tone="muted" />
        <AppText variant="label">{title}</AppText>
        <AppText variant="caption" tone="muted">
          {description}
        </AppText>
      </View>
    </Pressable>
  );
}

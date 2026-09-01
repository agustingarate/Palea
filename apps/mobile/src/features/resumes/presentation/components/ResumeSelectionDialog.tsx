import { useState } from 'react';
import { Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import type { Resume } from '@palea/contracts';
import { AppText, Badge, Button, Icon } from '@palea/ui-native';
import { AppDialog } from '@/common/presentation/components/AppDialog';
import { useLocale } from '@/core/localization/LocaleProvider';

export function ResumeSelectionDialog({
  resumes,
  selected,
  busy,
  onDismiss,
  onSelect,
  onUpload,
}: {
  resumes: Resume[];
  selected: string | null;
  busy: boolean;
  onDismiss: () => void;
  onSelect: (id: string | null) => void;
  onUpload: () => void;
}) {
  const { t } = useLocale('resumes');
  const { height } = useWindowDimensions();
  return (
    <AppDialog title={t('selectTitle')} busy={busy} onDismiss={onDismiss}>
      <View className="gap-2 border-b border-border p-5 dark:border-dark-border">
        <AppText variant="sectionTitle" accessibilityRole="header">
          {t('selectTitle')}
        </AppText>
        <AppText variant="bodySmall" tone="muted">
          {t('selectHelp')}
        </AppText>
      </View>
      <ScrollView
        style={{ maxHeight: height * 0.55 }}
        contentContainerStyle={{ padding: 16, gap: 8 }}
      >
        <ResumeChoice
          label={t('selectNone')}
          selected={selected === null}
          disabled={busy}
          onPress={() => onSelect(null)}
        />
        {resumes.map((resume) => (
          <ResumeChoice
            key={resume.id}
            label={resume.displayName}
            primary={resume.isPrimary}
            selected={selected === resume.id}
            disabled={busy}
            onPress={() => onSelect(resume.id)}
          />
        ))}
      </ScrollView>
      <View className="gap-2 border-t border-border p-4 dark:border-dark-border">
        <Button
          label={t('uploadNew')}
          leadingIcon="upload"
          variant="secondary"
          loading={busy}
          onPress={onUpload}
        />
        <Button
          label={t('cancel')}
          variant="ghost"
          disabled={busy}
          onPress={onDismiss}
        />
      </View>
    </AppDialog>
  );
}

function ResumeChoice({
  label,
  primary,
  selected,
  disabled,
  onPress,
}: {
  label: string;
  primary?: boolean;
  selected: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  const { t } = useLocale('resumes');
  const [focused, setFocused] = useState(false);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      className={`min-h-14 flex-row items-center gap-3 rounded-sm border p-3 ${selected ? 'border-interaction bg-interaction-subtle dark:border-dark-interaction dark:bg-dark-interaction-subtle' : 'border-border bg-surface dark:border-dark-border dark:bg-dark-surface'} ${focused ? 'border-focus-ring dark:border-dark-focus-ring' : ''}`}
    >
      <Icon
        name="fileText"
        size="md"
        tone={selected ? 'interaction' : 'muted'}
      />
      <View className="min-w-0 flex-1 gap-1">
        <AppText variant="bodySmall" numberOfLines={2}>
          {label}
        </AppText>
        {primary ? <Badge label={t('primary')} tone="interaction" /> : null}
      </View>
      {selected ? <Icon name="check" size="md" tone="interaction" /> : null}
    </Pressable>
  );
}

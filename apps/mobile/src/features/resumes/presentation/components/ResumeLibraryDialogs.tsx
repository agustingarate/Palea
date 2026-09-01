import { useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import {
  AppText,
  Button,
  Icon,
  TextField,
  type IconName,
} from '@palea/ui-native';
import type { Resume } from '@palea/contracts';
import { useLocale } from '@/core/localization/LocaleProvider';
import { AppDialog } from '@/common/presentation/components/AppDialog';

export type ResumeDialogState = {
  kind: 'menu' | 'rename' | 'delete';
  resumeId: string;
  anchor?: { x: number; y: number };
};
export function ResumeLibraryDialogs({
  state,
  resume,
  pending,
  error,
  impact,
  impactLoading,
  impactError,
  impactChanged,
  onDismiss,
  onAction,
  onRename,
  onDelete,
  onRetryImpact,
}: {
  state: ResumeDialogState | null;
  resume?: Resume;
  pending: boolean;
  error: boolean;
  impact?: { applicationCount: number; isPrimary: boolean };
  impactLoading: boolean;
  impactError: boolean;
  impactChanged: boolean;
  onDismiss: () => void;
  onAction: (
    action: 'rename' | 'delete' | 'primary' | 'download' | 'open',
  ) => void;
  onRename: (name: string) => void;
  onDelete: () => void;
  onRetryImpact: () => void;
}) {
  const { t } = useLocale('resumes');
  if (!state || !resume) return null;
  if (state.kind === 'rename')
    return (
      <ResumeRenameDialog
        key={resume.id}
        resume={resume}
        pending={pending}
        error={error}
        onDismiss={onDismiss}
        onSave={onRename}
      />
    );
  if (state.kind === 'menu')
    return (
      <AppDialog
        title={t('actions', { name: resume.displayName })}
        onDismiss={onDismiss}
        anchor={state.anchor}
        sheet
      >
        <View className="border-b border-border px-4 py-3 dark:border-dark-border">
          <AppText variant="label" numberOfLines={1}>
            {resume.displayName}
          </AppText>
        </View>
        <View className="p-2">
          <MenuAction
            icon="eye"
            label={t('open', { name: resume.displayName })}
            onPress={() => onAction('open')}
          />
          <MenuAction
            icon="download"
            label={t('download')}
            onPress={() => onAction('download')}
          />
          <MenuAction
            icon="edit"
            label={t('rename')}
            onPress={() => onAction('rename')}
          />
          {!resume.isPrimary ? (
            <MenuAction
              icon="star"
              label={t('makePrimary')}
              onPress={() => onAction('primary')}
            />
          ) : null}
          <View className="my-1 border-t border-border dark:border-dark-border" />
          <MenuAction
            icon="trash"
            label={t('delete')}
            danger
            onPress={() => onAction('delete')}
          />
        </View>
      </AppDialog>
    );
  return (
    <AppDialog
      title={t('deleteTitle')}
      busy={pending}
      onDismiss={onDismiss}
      returnFocusId="resume-library-upload"
    >
      <View className="gap-4 p-6">
        <View className="h-12 w-12 items-center justify-center rounded-full bg-danger-subtle dark:bg-dark-danger-subtle">
          <Icon name="trash" tone="danger" />
        </View>
        <AppText accessibilityRole="header" variant="sectionTitle">
          {t('deleteTitle')}
        </AppText>
        <AppText variant="bodySmall" tone="muted">
          {t('deleteHelp')}
        </AppText>
        <View className="gap-2 rounded-sm bg-surface-subtle p-3 dark:bg-dark-surface-subtle">
          <AppText variant="label" numberOfLines={2}>
            {resume.displayName}
          </AppText>
          {impactLoading ? (
            <View className="flex-row items-center gap-2">
              <ActivityIndicator />
              <AppText variant="caption">{t('impactLoading')}</AppText>
            </View>
          ) : null}
          {impact ? (
            <>
              {impact.isPrimary ? (
                <AppText variant="caption" tone="warning">
                  {t('deletePrimary')}
                </AppText>
              ) : null}
              <AppText variant="bodySmall">
                {impact.applicationCount
                  ? t('deleteApplications', { count: impact.applicationCount })
                  : t('deleteNoApplications')}
              </AppText>
            </>
          ) : null}
          {impactError ? (
            <Button
              label={t('retry')}
              variant="secondary"
              onPress={onRetryImpact}
            />
          ) : null}
        </View>
        {impactChanged ? (
          <AppText
            accessibilityLiveRegion="polite"
            tone="warning"
            variant="bodySmall"
          >
            {t('impactChanged')}
          </AppText>
        ) : null}
        {error ? (
          <AppText accessibilityRole="alert" tone="danger" variant="bodySmall">
            {t('deleteError')}
          </AppText>
        ) : null}
        <AppText variant="caption" tone="muted">
          {t('deleteMessage')}
        </AppText>
        <View className="flex-row justify-end gap-2">
          <Button
            label={t('cancel')}
            variant="secondary"
            disabled={pending}
            onPress={onDismiss}
          />
          <Button
            label={t('deleteConfirm')}
            variant="destructive"
            loading={pending}
            disabled={!impact || impactError}
            onPress={onDelete}
          />
        </View>
      </View>
    </AppDialog>
  );
}

function ResumeRenameDialog({
  resume,
  pending,
  error,
  onDismiss,
  onSave,
}: {
  resume: Resume;
  pending: boolean;
  error: boolean;
  onDismiss: () => void;
  onSave: (name: string) => void;
}) {
  const { t } = useLocale('resumes');
  const [name, setName] = useState(resume.displayName);
  const [attempted, setAttempted] = useState(false);
  const save = () => {
    setAttempted(true);
    if (name.trim()) onSave(name.trim());
  };
  return (
    <AppDialog title={t('renameTitle')} onDismiss={onDismiss} busy={pending}>
      <View className="gap-4 p-6">
        <AppText accessibilityRole="header" variant="sectionTitle">
          {t('renameTitle')}
        </AppText>
        <AppText variant="bodySmall" tone="muted">
          {t('renameHelp')}
        </AppText>
        <TextField
          label={t('nameLabel')}
          value={name}
          onChangeText={setName}
          maxLength={160}
          autoFocus
          disabled={pending}
          onSubmitEditing={save}
          returnKeyType="done"
          error={
            attempted && !name.trim()
              ? t('renameRequired')
              : error
                ? t('renameError')
                : undefined
          }
        />
        <View className="flex-row justify-end gap-2">
          <Button
            label={t('cancel')}
            variant="secondary"
            disabled={pending}
            onPress={onDismiss}
          />
          <Button label={t('save')} loading={pending} onPress={save} />
        </View>
      </View>
    </AppDialog>
  );
}

function MenuAction({
  label,
  icon,
  danger = false,
  onPress,
}: {
  label: string;
  icon: IconName;
  danger?: boolean;
  onPress: () => void;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <Pressable
      accessibilityRole="button"
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onPress={onPress}
      className={`min-h-11 flex-row items-center gap-3 rounded-sm border px-3 hover:bg-surface-subtle dark:hover:bg-dark-surface-subtle ${focused ? 'border-focus-ring dark:border-dark-focus-ring' : 'border-transparent'}`}
    >
      <Icon name={icon} size="md" tone={danger ? 'danger' : 'muted'} />
      <AppText
        variant="bodySmall"
        tone={danger ? 'danger' : 'default'}
        numberOfLines={1}
        className="flex-1"
      >
        {label}
      </AppText>
    </Pressable>
  );
}

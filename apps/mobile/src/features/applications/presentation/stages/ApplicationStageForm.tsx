import { useCallback, useEffect, useRef, useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, View } from 'react-native';
import { useForm } from '@tanstack/react-form';
import { useNavigation, useRouter } from 'expo-router';
import {
  AppText,
  Breadcrumbs,
  Button,
  DatePickerField,
  FormSection,
  Screen,
  SegmentedControl,
  StickyActionBar,
  TextAreaField,
  TextField,
  TopAppBar,
  useResponsiveLayout,
  useSnackbar,
} from '@palea/ui-native';
import type {
  ApplicationStage,
  ApplicationStageDifficulty,
  ApplicationStageResult,
} from '../../domain/entities/Application';
import { useLocale } from '@/core/localization/LocaleProvider';
import { useSignOut } from '@/core/session/useSignOut';
import { ProductDesktopNavigation } from '@/common/presentation/components/ProductDesktopNavigation';
import type { ApplicationStageFormValues } from './applicationStageModel';
import { stageValuesForResult } from './applicationStageModel';

export function ApplicationStageForm({
  mode,
  initialValues,
  busy,
  onSubmit,
  onSaved,
  onDelete,
  onDeleted,
  onBack,
}: {
  mode: 'create' | 'edit';
  initialValues: ApplicationStageFormValues;
  busy: boolean;
  onSubmit: (values: ApplicationStageFormValues) => Promise<ApplicationStage>;
  onSaved: (stage: ApplicationStage) => void;
  onDelete?: () => Promise<void>;
  onDeleted?: () => void;
  onBack: () => void;
}) {
  const { t } = useLocale('applications');
  const layout = useResponsiveLayout();
  const navigation = useNavigation();
  const router = useRouter();
  const signOut = useSignOut();
  const { showSnackbar } = useSnackbar();
  const dirtyRef = useRef(false);
  const allowLeaveRef = useRef(false);
  const [discardAction, setDiscardAction] = useState<(() => void) | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const form = useForm({
    defaultValues: initialValues,
    onSubmit: async ({ value }) => {
      setSubmissionError(null);
      try {
        const saved = await onSubmit(value);
        allowLeaveRef.current = true;
        onSaved(saved);
      } catch {
        setSubmissionError(t('stages.error.save'));
      }
    },
  });
  const requestLeave = useCallback((action: () => void) => {
    if (!dirtyRef.current || allowLeaveRef.current) return action();
    setDiscardAction(() => action);
  }, []);
  const back = () => requestLeave(onBack);

  useEffect(
    () =>
      navigation.addListener('beforeRemove', (event) => {
        if (!dirtyRef.current || allowLeaveRef.current) return;
        event.preventDefault();
        setDiscardAction(() => () => {
          allowLeaveRef.current = true;
          navigation.dispatch(event.data.action);
        });
      }),
    [navigation],
  );
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const preventUnload = (event: BeforeUnloadEvent) => {
      if (!dirtyRef.current || allowLeaveRef.current) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', preventUnload);
    return () => window.removeEventListener('beforeunload', preventUnload);
  }, []);

  const resultItems = (
    ['pending', 'waiting', 'successful', 'failed'] as const
  ).map((value) => ({ value, label: t(`stages.result.${value}`) }));
  const difficultyItems = (['easy', 'medium', 'hard'] as const).map(
    (value) => ({ value, label: t(`stages.difficulty.${value}`) }),
  );
  const stageDetails = (
    <FormSection
      contained={layout.isWeb}
      leadingIcon="briefcase"
      title={t('stages.form.details')}
    >
      <form.Field name="name">
        {(field) => (
          <TextField
            label={t('stages.form.name')}
            placeholder={t('stages.form.namePlaceholder')}
            required
            maxLength={120}
            value={field.state.value}
            onBlur={field.handleBlur}
            onChangeText={field.handleChange}
          />
        )}
      </form.Field>
      <form.Field name="eventOn">
        {(field) => (
          <DatePickerField
            label={t('stages.form.date')}
            value={field.state.value}
            placeholder={t('stages.form.noDate')}
            helperText={t('stages.form.dateHelp')}
            clearLabel={t('actions.clear')}
            todayLabel={t('create.today')}
            cancelLabel={t('actions.cancel')}
            confirmLabel={t('actions.confirm')}
            onChange={field.handleChange}
          />
        )}
      </form.Field>
    </FormSection>
  );
  const status = (
    <FormSection
      contained={layout.isWeb}
      leadingIcon="circleDashed"
      title={t('stages.form.status')}
    >
      <form.Field name="result">
        {(field) => (
          <SegmentedControl
            label={t('stages.form.result')}
            items={resultItems}
            value={field.state.value}
            onValueChange={(value) => {
              const next = stageValuesForResult(
                form.state.values,
                value as ApplicationStageResult,
              );
              field.handleChange(next.result);
              form.setFieldValue('difficulty', next.difficulty);
            }}
          />
        )}
      </form.Field>
      <form.Subscribe selector={(state) => state.values.result}>
        {(result) => (
          <form.Field name="difficulty">
            {(field) => (
              <SegmentedControl
                label={t('stages.form.difficulty')}
                items={difficultyItems}
                value={field.state.value ?? 'easy'}
                disabled={result === 'pending'}
                onValueChange={(value) =>
                  field.handleChange(value as ApplicationStageDifficulty)
                }
              />
            )}
          </form.Field>
        )}
      </form.Subscribe>
    </FormSection>
  );
  const notes = (
    <FormSection
      contained={layout.isWeb}
      leadingIcon="notes"
      title={t('stages.form.notes')}
    >
      <form.Field name="questions">
        {(field) => (
          <TextAreaField
            label={t('stages.form.questions')}
            placeholder={t('stages.form.questionsPlaceholder')}
            maxLength={10_000}
            value={field.state.value}
            onBlur={field.handleBlur}
            onChangeText={field.handleChange}
          />
        )}
      </form.Field>
      <form.Field name="comments">
        {(field) => (
          <TextAreaField
            label={t('stages.form.comments')}
            placeholder={t('stages.form.commentsPlaceholder')}
            maxLength={10_000}
            value={field.state.value}
            onBlur={field.handleBlur}
            onChangeText={field.handleChange}
          />
        )}
      </form.Field>
    </FormSection>
  );

  const notifyPending = () =>
    showSnackbar({ variant: 'info', message: t('nav.pending') });
  return (
    <Screen edges={['top', 'bottom']}>
      <View className="flex-1 flex-row">
        {layout.isExpanded ? (
          <ProductDesktopNavigation
            labels={{
              applications: t('nav.applications'),
              metrics: t('nav.metrics'),
              resumes: t('nav.resumes'),
              profile: t('nav.profile'),
              add: t('add'),
              tracker: t('sidebar.tracker'),
              logout: t('nav.logout'),
            }}
            onAdd={() => router.push('/applications/new')}
            onPending={notifyPending}
            onSignOut={() => void signOut.mutateAsync()}
            signingOut={signOut.isPending}
          />
        ) : null}
        <View className="flex-1">
          <TopAppBar
            title={t(
              mode === 'create' ? 'stages.addTitle' : 'stages.editTitle',
            )}
            subtitle={layout.isWeb ? t('stages.form.subtitle') : undefined}
            leading={
              <Button
                label="‹"
                accessibilityLabel={t('stages.back')}
                variant="ghost"
                size="sm"
                onPress={back}
              />
            }
            trailing={
              mode === 'edit' ? (
                <Button
                  label={t('stages.delete')}
                  variant="destructive"
                  size="sm"
                  disabled={busy}
                  onPress={() => setDeleteOpen(true)}
                />
              ) : undefined
            }
            trailingClassName={mode === 'edit' ? 'items-end' : undefined}
          />
          <ScrollView
            className="flex-1"
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{
              alignSelf: 'center',
              gap: 24,
              maxWidth: layout.contentMaxWidth ?? 760,
              paddingHorizontal: layout.pageGutter,
              paddingVertical: layout.isExpanded ? 36 : 24,
              width: '100%',
            }}
          >
            {layout.isWeb ? (
              <Breadcrumbs
                homeLabel={t('breadcrumb.home')}
                onHomePress={() => router.replace('/')}
                items={[
                  { label: t('nav.applications'), onPress: onBack },
                  {
                    label: t(
                      mode === 'create'
                        ? 'stages.addTitle'
                        : 'stages.editTitle',
                    ),
                  },
                ]}
              />
            ) : null}
            {layout.isExpanded ? (
              <View className="flex-row items-start gap-6">
                <View className="flex-[2] gap-6">
                  {stageDetails}
                  {notes}
                </View>
                <View className="flex-1 gap-6">{status}</View>
              </View>
            ) : (
              <View className="gap-7">
                {stageDetails}
                {status}
                {notes}
              </View>
            )}
            {submissionError ? (
              <AppText accessibilityLiveRegion="polite" tone="danger">
                {submissionError}
              </AppText>
            ) : null}
            <form.Subscribe selector={(state) => state.isDirty}>
              {(isDirty) => {
                dirtyRef.current = isDirty;
                return null;
              }}
            </form.Subscribe>
          </ScrollView>
          <StickyActionBar>
            <Button
              label={t('actions.cancel')}
              variant="ghost"
              disabled={busy}
              onPress={back}
            />
            <Button
              label={t(
                mode === 'create' ? 'stages.saveNew' : 'stages.saveEdit',
              )}
              loading={busy}
              onPress={() => void form.handleSubmit()}
            />
          </StickyActionBar>
        </View>
      </View>
      <ConfirmDialog
        visible={discardAction !== null}
        title={t('stages.discard.title')}
        message={t('stages.discard.message')}
        cancelLabel={t('stages.discard.keep')}
        confirmLabel={t('stages.discard.confirm')}
        destructive
        onCancel={() => setDiscardAction(null)}
        onConfirm={() => {
          const action = discardAction;
          setDiscardAction(null);
          allowLeaveRef.current = true;
          action?.();
        }}
      />
      <ConfirmDialog
        visible={deleteOpen}
        title={t('stages.deleteConfirm.title')}
        message={t('stages.deleteConfirm.message')}
        cancelLabel={t('actions.cancel')}
        confirmLabel={t('stages.delete')}
        destructive
        busy={busy}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() =>
          void (async () => {
            try {
              await onDelete?.();
              allowLeaveRef.current = true;
              onDeleted?.();
            } catch {
              setDeleteOpen(false);
              setSubmissionError(t('stages.error.delete'));
            }
          })()
        }
      />
    </Screen>
  );
}

function ConfirmDialog({
  visible,
  title,
  message,
  cancelLabel,
  confirmLabel,
  destructive,
  busy,
  onCancel,
  onConfirm,
}: {
  visible: boolean;
  title: string;
  message: string;
  cancelLabel: string;
  confirmLabel: string;
  destructive?: boolean;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onCancel}
    >
      <Pressable
        className="flex-1 items-center justify-center bg-black/40 p-6"
        onPress={onCancel}
      >
        <Pressable
          accessibilityRole="alert"
          className="w-full max-w-md gap-5 rounded-2xl bg-surface p-6 shadow-lg"
          onPress={() => undefined}
        >
          <View className="gap-2">
            <AppText variant="sectionTitle">{title}</AppText>
            <AppText tone="muted">{message}</AppText>
          </View>
          <View className="flex-row justify-end gap-3">
            <Button
              label={cancelLabel}
              variant="secondary"
              disabled={busy}
              onPress={onCancel}
            />
            <Button
              label={confirmLabel}
              variant={destructive ? 'destructive' : 'primary'}
              loading={busy}
              onPress={onConfirm}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

import { useState } from 'react';
import { View } from 'react-native';
import { useForm } from '@tanstack/react-form';
import { useRouter } from 'expo-router';
import {
  createProfileExperienceInputSchema,
  type CreateProfileExperienceInput,
} from '@palea/contracts';
import {
  AppText,
  Breadcrumbs,
  Button,
  Checkbox,
  CollectionFeedback,
  DatePickerField,
  FocusedFormLayout,
  IconButton,
  TextField,
  useSnackbar,
  useResponsiveLayout,
} from '@palea/ui-native';
import { AppDialog } from '@/common/presentation/components/AppDialog';
import { useLocale } from '@/core/localization/LocaleProvider';
import { useProfileExperienceFormViewModel } from './useProfileExperiencesViewModel';

const emptyExperience: CreateProfileExperienceInput = {
  companyName: '',
  role: '',
  startedOn: '',
  endedOn: null,
  isCurrent: false,
};

export function ProfileExperienceFormScreen({
  experienceId,
}: {
  experienceId?: string;
}) {
  const { t } = useLocale('profile');
  const router = useRouter();
  const vm = useProfileExperienceFormViewModel(experienceId);
  if (vm.isLoading)
    return (
      <FocusedFormLayout title={t('experienceEditTitle')}>
        <CollectionFeedback status="loading" rows={4} />
      </FocusedFormLayout>
    );
  if (experienceId && !vm.experience)
    return (
      <FocusedFormLayout title={t('experienceEditTitle')}>
        <CollectionFeedback
          status="error"
          title={t('experienceErrorTitle')}
          message={t('experienceErrorMessage')}
          actionLabel={t('retry')}
          onAction={() => void vm.retry()}
        />
      </FocusedFormLayout>
    );
  return (
    <ProfileExperienceForm
      key={experienceId ?? 'new'}
      experienceId={experienceId}
      initial={vm.experience ?? emptyExperience}
      save={vm.save}
      remove={vm.remove}
      onDone={() => router.replace('/profile/experiences' as never)}
      onBack={() => router.back()}
    />
  );
}

function ProfileExperienceForm({
  experienceId,
  initial,
  save,
  remove,
  onDone,
  onBack,
}: {
  experienceId?: string;
  initial: CreateProfileExperienceInput;
  save: ReturnType<typeof useProfileExperienceFormViewModel>['save'];
  remove: ReturnType<typeof useProfileExperienceFormViewModel>['remove'];
  onDone: () => void;
  onBack: () => void;
}) {
  const { t } = useLocale('profile');
  const { showSnackbar } = useSnackbar();
  const layout = useResponsiveLayout();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const form = useForm({
    defaultValues: initial,
    validators: { onSubmit: createProfileExperienceInputSchema },
    onSubmit: async ({ value }) => {
      try {
        await save.mutateAsync(
          experienceId ? { ...value, experienceId } : value,
        );
        showSnackbar({
          variant: 'success',
          message: t('experienceSaveSuccess'),
        });
        onDone();
      } catch {
        // TanStack mutation state renders the localized error; draft is retained.
      }
    },
  });
  const removeExperience = async () => {
    try {
      await remove.mutateAsync();
      showSnackbar({
        variant: 'success',
        message: t('experienceDeleteSuccess'),
      });
      setConfirmDelete(false);
      onDone();
    } catch {
      // Dialog stays open and exposes a recoverable error.
    }
  };
  const busy = save.isPending || remove.isPending;
  return (
    <FocusedFormLayout
      keyboardAware
      title={
        experienceId ? t('experienceEditTitle') : t('experienceCreateTitle')
      }
      description={t('experienceFormSubtitle')}
      progress={
        <IconButton
          icon="arrowBack"
          accessibilityLabel={t('back')}
          disabled={busy}
          onPress={onBack}
        />
      }
    >
      {layout.isWeb ? (
        <Breadcrumbs
          homeLabel={t('breadcrumbHome')}
          onHomePress={onDone}
          items={[
            { label: t('title'), onPress: onDone },
            { label: t('experienceTitle'), onPress: onDone },
            {
              label: experienceId
                ? t('experienceEditTitle')
                : t('experienceCreateTitle'),
            },
          ]}
        />
      ) : null}
      <form.Field name="companyName">
        {(field) => (
          <TextField
            label={t('company')}
            placeholder={t('companyPlaceholder')}
            required
            value={field.state.value}
            disabled={busy}
            onBlur={field.handleBlur}
            onChangeText={field.handleChange}
            error={
              field.state.meta.isTouched && field.state.meta.errors.length
                ? t('validationCompany')
                : undefined
            }
          />
        )}
      </form.Field>
      <form.Field name="role">
        {(field) => (
          <TextField
            label={t('position')}
            placeholder={t('positionPlaceholder')}
            required
            value={field.state.value}
            disabled={busy}
            onBlur={field.handleBlur}
            onChangeText={field.handleChange}
            error={
              field.state.meta.isTouched && field.state.meta.errors.length
                ? t('validationPosition')
                : undefined
            }
          />
        )}
      </form.Field>
      <View className="gap-4 md:flex-row">
        <View className="flex-1">
          <form.Field name="startedOn">
            {(field) => (
              <DatePickerField
                label={t('startedOn')}
                value={field.state.value || null}
                placeholder={t('datePlaceholder')}
                clearLabel={t('clearDate')}
                todayLabel={t('today')}
                cancelLabel={t('cancel')}
                confirmLabel={t('confirm')}
                disabled={busy}
                error={
                  field.state.meta.isTouched && field.state.meta.errors.length
                    ? t('validationDate')
                    : undefined
                }
                onChange={(value) => field.handleChange(value ?? '')}
              />
            )}
          </form.Field>
        </View>
        <View className="flex-1">
          <form.Subscribe selector={(state) => state.values.isCurrent}>
            {(isCurrent) =>
              isCurrent ? null : (
                <form.Field name="endedOn">
                  {(field) => (
                    <DatePickerField
                      label={t('endedOn')}
                      value={field.state.value}
                      placeholder={t('datePlaceholder')}
                      clearLabel={t('clearDate')}
                      cancelLabel={t('cancel')}
                      confirmLabel={t('confirm')}
                      disabled={busy}
                      error={
                        field.state.meta.isTouched &&
                        field.state.meta.errors.length
                          ? t('validationEndBeforeStart')
                          : undefined
                      }
                      onChange={field.handleChange}
                    />
                  )}
                </form.Field>
              )
            }
          </form.Subscribe>
        </View>
      </View>
      <form.Field name="isCurrent">
        {(field) => (
          <Checkbox
            label={t('experienceCurrent')}
            checked={field.state.value}
            disabled={busy}
            onChange={(checked) => {
              field.handleChange(checked);
              if (checked) form.setFieldValue('endedOn', null);
            }}
          />
        )}
      </form.Field>
      {save.isError ? (
        <AppText accessibilityLiveRegion="polite" tone="danger">
          {t('experienceSaveError')}
        </AppText>
      ) : null}
      <View className="flex-row flex-wrap justify-end gap-3">
        {experienceId ? (
          <Button
            label={t('experienceDelete')}
            variant="destructive"
            disabled={busy}
            onPress={() => setConfirmDelete(true)}
          />
        ) : null}
        <form.Subscribe
          selector={(state) => ({
            canSubmit: state.canSubmit,
            isDirty: state.isDirty,
          })}
        >
          {({ canSubmit, isDirty }) => (
            <Button
              label={t('save')}
              loading={save.isPending}
              disabled={!canSubmit || !isDirty || busy}
              onPress={() => form.handleSubmit()}
            />
          )}
        </form.Subscribe>
      </View>
      {confirmDelete ? (
        <AppDialog
          title={t('experienceDeleteTitle')}
          busy={remove.isPending}
          onDismiss={() => setConfirmDelete(false)}
        >
          <View className="gap-4 p-5">
            <AppText variant="sectionTitle">
              {t('experienceDeleteTitle')}
            </AppText>
            <AppText tone="muted">{t('experienceDeleteMessage')}</AppText>
            {remove.isError ? (
              <AppText accessibilityLiveRegion="polite" tone="danger">
                {t('experienceDeleteError')}
              </AppText>
            ) : null}
            <View className="flex-row justify-end gap-2">
              <Button
                label={t('cancel')}
                variant="ghost"
                disabled={remove.isPending}
                onPress={() => setConfirmDelete(false)}
              />
              <Button
                label={t('experienceDeleteConfirm')}
                variant="destructive"
                loading={remove.isPending}
                onPress={() => void removeExperience()}
              />
            </View>
          </View>
        </AppDialog>
      ) : null}
    </FocusedFormLayout>
  );
}

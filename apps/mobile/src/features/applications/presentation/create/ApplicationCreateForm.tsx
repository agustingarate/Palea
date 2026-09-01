import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, View } from 'react-native';
import { useResumeFilePicker } from '@/features/resumes/presentation/viewmodels/useResumeFilePicker';
import { useForm } from '@tanstack/react-form';
import { currencyCatalog } from '@palea/contracts';
import {
  AppText,
  Breadcrumbs,
  Button,
  DatePickerField,
  FeedbackMessage,
  FileUploadField,
  FormSection,
  Notice,
  ProgressIndicator,
  ResponsiveGrid,
  RichTextEditor,
  Screen,
  SearchableSelect,
  SegmentedControl,
  StickyActionBar,
  TextAreaField,
  TextField,
  TopAppBar,
  useResponsiveLayout,
  useSnackbar,
} from '@palea/ui-native';
import { useNavigation, useRouter } from 'expo-router';
import { useLocale } from '@/core/localization/LocaleProvider';
import { useSignOut } from '@/core/session/useSignOut';
import { ProductDesktopNavigation } from '@/common/presentation/components/ProductDesktopNavigation';
import { navigateToApplicationsHome } from '../navigation/applicationsHomeNavigation';
import {
  applicationCreateDefaults,
  applicationCreateFormSchema,
  toCreateApplicationInput,
  todayLocal,
} from './applicationCreateModel';
import { useApplicationCreateViewModel } from './useApplicationCreateViewModel';

const NONE_RESUME = 'none';
const currencyCountries: Record<string, string> = {
  ARS: 'AR',
  AUD: 'AU',
  BRL: 'BR',
  CAD: 'CA',
  CHF: 'CH',
  CLP: 'CL',
  COP: 'CO',
  EUR: 'EU',
  GBP: 'GB',
  JPY: 'JP',
  MXN: 'MX',
  NZD: 'NZ',
  PEN: 'PE',
  USD: 'US',
  UYU: 'UY',
};

function currencySymbol(currency: string, locale: string) {
  return (
    new Intl.NumberFormat(locale, { style: 'currency', currency })
      .formatToParts(0)
      .find((part) => part.type === 'currency')?.value ?? currency
  );
}

function currencyName(currency: string, locale: string) {
  return (
    new Intl.DisplayNames([locale], { type: 'currency' }).of(currency) ??
    currency
  );
}

export function ApplicationCreateForm() {
  const picker = useResumeFilePicker();
  const { t, i18n } = useLocale('applications');
  const layout = useResponsiveLayout();
  const navigation = useNavigation();
  const router = useRouter();
  const { showSnackbar } = useSnackbar();
  const signOutMutation = useSignOut();
  const vm = useApplicationCreateViewModel();
  const [step, setStep] = useState<1 | 2>(1);
  const [descriptionSource, setDescriptionSource] = useState<
    'manual' | 'url' | 'image'
  >('manual');
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedResume, setUploadedResume] = useState(false);
  const [discardAction, setDiscardAction] = useState<(() => void) | null>(null);
  const dirtyRef = useRef(false);
  const allowLeaveRef = useRef(false);
  const defaultResumeApplied = useRef(false);
  const form = useForm({
    defaultValues: applicationCreateDefaults,
    validators: { onSubmit: applicationCreateFormSchema },
    onSubmit: async ({ value }) => {
      setSubmissionError(null);
      try {
        await vm.create.mutateAsync(toCreateApplicationInput(value));
        allowLeaveRef.current = true;
        showSnackbar({ variant: 'success', message: t('create.success') });
        navigateToApplicationsHome(router);
      } catch {
        setSubmissionError(t('create.error'));
      }
    },
  });
  const requestDiscard = useCallback((action: () => void) => {
    setDiscardAction(() => action);
  }, []);

  useEffect(() => {
    if (defaultResumeApplied.current || !vm.resumes.data) return;
    defaultResumeApplied.current = true;
    const primary = vm.resumes.data.find((resume) => resume.isPrimary);
    if (primary)
      form.setFieldValue('resumeId', primary.id, { dontUpdateMeta: true });
  }, [form, vm.resumes.data]);

  useEffect(
    () =>
      navigation.addListener('beforeRemove', (event) => {
        if (!dirtyRef.current || allowLeaveRef.current) return;
        event.preventDefault();
        requestDiscard(() => {
          allowLeaveRef.current = true;
          navigation.dispatch(event.data.action);
        });
      }),
    [navigation, requestDiscard],
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

  const currencyOptions = useMemo(() => {
    const regionNames = new Intl.DisplayNames([i18n.language], {
      type: 'region',
    });
    return currencyCatalog.map((currency) => {
      const countryCode = currencyCountries[currency.code];
      const region = countryCode ? regionNames.of(countryCode) : undefined;
      return {
        value: currency.code,
        label: `${currencySymbol(currency.code, i18n.language)} · ${region ?? currencyName(currency.code, i18n.language)} (${currency.code})`,
        selectedLabel: `${currencySymbol(currency.code, i18n.language)} (${currency.code})`,
        description: currencyName(currency.code, i18n.language),
      };
    });
  }, [i18n.language]);
  const periodOptions = useMemo(
    () =>
      (['hour', 'day', 'week', 'month', 'year'] as const).map((value) => ({
        value,
        label: t(`create.period.${value}`),
      })),
    [t],
  );
  const resumeOptions = useMemo(
    () => [
      { value: NONE_RESUME, label: t('create.noResume') },
      ...(vm.resumes.data ?? []).map((resume) => ({
        value: resume.id,
        label: resume.displayName,
        description: resume.isPrimary ? t('create.resumeHelp') : undefined,
      })),
    ],
    [t, vm.resumes.data],
  );
  const commonOptions = {
    workMode: [
      { value: 'unspecified', label: t('create.unspecified') },
      { value: 'remote', label: t('workMode.remote') },
      { value: 'hybrid', label: t('workMode.hybrid') },
      { value: 'onsite', label: t('workMode.onsite') },
    ] as const,
    commitment: [
      { value: 'unspecified', label: t('create.unspecified') },
      { value: 'full_time', label: t('create.fullTime') },
      { value: 'part_time', label: t('create.partTime') },
    ] as const,
    contractType: [
      { value: 'unspecified', label: t('create.unspecified') },
      { value: 'employment', label: t('create.employment') },
      { value: 'freelance', label: t('create.freelance') },
      { value: 'services', label: t('create.services') },
      { value: 'internship', label: t('create.internship') },
      { value: 'other', label: t('create.other') },
    ] as const,
    durationType: [
      { value: 'unspecified', label: t('create.unspecified') },
      { value: 'indefinite', label: t('create.indefinite') },
      { value: 'temporary', label: t('create.temporary') },
    ] as const,
  };

  const uploadResume = async () => {
    setUploadError(null);
    try {
      const file = await picker.selection.mutateAsync();
      if (!file) return;
      const resumeId = await vm.upload.mutateAsync(file);
      setUploadedResume(true);
      form.setFieldValue('resumeId', resumeId);
    } catch {
      setUploadError(t('create.uploadError'));
    }
  };
  const cancel = () => {
    if (!dirtyRef.current) {
      allowLeaveRef.current = true;
      navigateToApplicationsHome(router);
      return;
    }
    requestDiscard(() => {
      allowLeaveRef.current = true;
      navigateToApplicationsHome(router);
    });
  };
  const signOut = async () => {
    try {
      allowLeaveRef.current = true;
      await signOutMutation.mutateAsync();
      router.replace('/auth/login');
    } catch {
      allowLeaveRef.current = false;
      showSnackbar({ variant: 'error', message: t('nav.logoutError') });
    }
  };
  const requestSignOut = () => {
    if (!dirtyRef.current) {
      void signOut();
      return;
    }
    requestDiscard(() => void signOut());
  };
  const notifyPending = (destination: 'resumes' | 'metrics' | 'profile') => {
    if (destination === 'resumes') {
      // TODO(CU-86ajvbvec): navigate to the complete CV Library.
    } else if (destination === 'metrics') {
      // TODO(CU-86ajvbvfm): navigate to the applications metrics dashboard.
    } else {
      // TODO(CU-86ajvbvfq): navigate to the candidate profile.
    }
    showSnackbar({ variant: 'info', message: t('nav.pending') });
  };
  const compensationFields = (kind: 'expected' | 'offered', title: string) => {
    const minimumName = `${kind}Minimum` as const;
    const maximumName = `${kind}Maximum` as const;
    const currencyName = `${kind}Currency` as const;
    const periodName = `${kind}Period` as const;
    return (
      <View className="gap-3">
        <AppText variant="bodySmall" className="font-semibold">
          {title}
        </AppText>
        <View className="flex-row flex-wrap gap-2">
          <View style={{ flexBasis: layout.isWeb ? 172 : '46%', flexGrow: 1 }}>
            <form.Field name={minimumName}>
              {(field) => (
                <form.Subscribe
                  selector={(state) => state.values[currencyName]}
                >
                  {(currency) => (
                    <TextField
                      label={t('create.minimum')}
                      keyboardType="decimal-pad"
                      placeholder="0"
                      trailing={
                        <AppText
                          variant="caption"
                          tone="muted"
                          style={{ opacity: 0.55 }}
                        >
                          {currencySymbol(currency, i18n.language)}
                        </AppText>
                      }
                      value={field.state.value}
                      onChangeText={(value) =>
                        field.handleChange(value.replace(/[^0-9,\.]/g, ''))
                      }
                      error={fieldError(field.state.meta.errors, t)}
                    />
                  )}
                </form.Subscribe>
              )}
            </form.Field>
          </View>
          <View style={{ flexBasis: layout.isWeb ? 172 : '46%', flexGrow: 1 }}>
            <form.Field name={maximumName}>
              {(field) => (
                <form.Subscribe
                  selector={(state) => state.values[currencyName]}
                >
                  {(currency) => (
                    <TextField
                      label={t('create.maximum')}
                      keyboardType="decimal-pad"
                      placeholder="0"
                      trailing={
                        <AppText
                          variant="caption"
                          tone="muted"
                          style={{ opacity: 0.55 }}
                        >
                          {currencySymbol(currency, i18n.language)}
                        </AppText>
                      }
                      value={field.state.value}
                      onChangeText={(value) =>
                        field.handleChange(value.replace(/[^0-9,\.]/g, ''))
                      }
                      error={fieldError(field.state.meta.errors, t)}
                    />
                  )}
                </form.Subscribe>
              )}
            </form.Field>
          </View>
          <View style={{ alignSelf: 'flex-start', flexShrink: 0 }}>
            <form.Field name={currencyName}>
              {(field) => (
                <SearchableSelect
                  label={t('create.currency')}
                  placeholder="USD"
                  options={currencyOptions}
                  compact
                  leadingIcon="banknote"
                  value={field.state.value}
                  onValueChange={(value) =>
                    field.handleChange(value as typeof field.state.value)
                  }
                />
              )}
            </form.Field>
          </View>
          <View style={{ alignSelf: 'flex-start', flexShrink: 0 }}>
            <form.Field name={periodName}>
              {(field) => (
                <SearchableSelect
                  label={t('create.period')}
                  placeholder={t('create.period')}
                  searchable={false}
                  options={periodOptions}
                  compact
                  leadingIcon="rotateCcw"
                  value={field.state.value}
                  onValueChange={(value) =>
                    field.handleChange(value as typeof field.state.value)
                  }
                />
              )}
            </form.Field>
          </View>
        </View>
      </View>
    );
  };

  const firstStep = (
    <>
      <FormSection
        contained={layout.isWeb}
        leadingIcon="briefcase"
        title={t('create.roleDetails')}
      >
        <ResponsiveGrid columns={{ compact: 1, medium: 2, expanded: 2 }}>
          <form.Field name="companyName">
            {(field) => (
              <TextField
                label={t('create.company')}
                placeholder={t('create.companyPlaceholder')}
                required
                maxLength={120}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChangeText={field.handleChange}
                error={fieldError(field.state.meta.errors, t)}
              />
            )}
          </form.Field>
          <form.Field name="role">
            {(field) => (
              <TextField
                label={t('create.role')}
                placeholder={t('create.rolePlaceholder')}
                required
                maxLength={120}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChangeText={field.handleChange}
                error={fieldError(field.state.meta.errors, t)}
              />
            )}
          </form.Field>
        </ResponsiveGrid>
        <form.Field name="appliedOn">
          {(field) => (
            <DatePickerField
              label={t('create.date')}
              value={field.state.value}
              maximum={todayLocal()}
              placeholder={t('create.datePlaceholder')}
              helperText={t('create.dateHelp')}
              clearLabel={t('create.clearDate')}
              todayLabel={t('create.today')}
              cancelLabel={t('create.cancel')}
              confirmLabel={t('create.confirm')}
              onChange={field.handleChange}
              error={fieldError(field.state.meta.errors, t)}
            />
          )}
        </form.Field>
      </FormSection>
      <FormSection
        contained={layout.isWeb}
        leadingIcon="fileText"
        title={t('create.description')}
        description={t('create.descriptionHelp')}
      >
        <SegmentedControl
          label={t('create.source')}
          value={descriptionSource}
          onValueChange={(value) =>
            setDescriptionSource(value as 'manual' | 'url' | 'image')
          }
          items={[
            { value: 'manual', label: t('create.manual') },
            { value: 'url', label: t('create.url') },
            { value: 'image', label: t('create.image') },
          ]}
        />
        {descriptionSource === 'manual' ? (
          <form.Field name="jobDescriptionHtml">
            {(field) => (
              <RichTextEditor
                label={t('create.writeDescription')}
                value={field.state.value}
                placeholder={t('create.descriptionHelp')}
                linkLabel={t('create.link')}
                linkPlaceholder={t('create.linkPlaceholder')}
                cancelLabel={t('create.cancel')}
                confirmLabel={t('create.confirm')}
                undoLabel={t('create.undo')}
                redoLabel={t('create.redo')}
                onChange={field.handleChange}
                error={fieldError(field.state.meta.errors, t)}
              />
            )}
          </form.Field>
        ) : (
          <FeedbackMessage
            title={t('create.comingSoonTitle')}
            message={t(
              descriptionSource === 'url'
                ? 'create.urlComingSoon'
                : 'create.imageComingSoon',
            )}
          />
        )}
        <View className="gap-2">
          <AppText variant="label">{t('create.skills')}</AppText>
          <Notice
            title={t('create.skillsTitle')}
            message={t('create.skillsMessage')}
          />
        </View>
      </FormSection>
    </>
  );

  const secondStep = (
    <>
      <FormSection
        contained={layout.isWeb}
        leadingIcon="slidersHorizontal"
        title={t('create.details')}
      >
        <ResponsiveGrid columns={{ compact: 1, medium: 2, expanded: 2 }}>
          <form.Field name="workMode">
            {(field) => (
              <SegmentedControl
                label={t('create.workMode')}
                items={[...commonOptions.workMode]}
                value={field.state.value}
                onValueChange={(value) =>
                  field.handleChange(value as typeof field.state.value)
                }
              />
            )}
          </form.Field>
          <form.Field name="commitment">
            {(field) => (
              <SegmentedControl
                label={t('create.commitment')}
                items={[...commonOptions.commitment]}
                value={field.state.value}
                onValueChange={(value) =>
                  field.handleChange(value as typeof field.state.value)
                }
              />
            )}
          </form.Field>
          <form.Field name="contractType">
            {(field) => (
              <SearchableSelect
                label={t('create.contractType')}
                options={commonOptions.contractType}
                placeholder={t('create.unspecified')}
                searchable={false}
                value={field.state.value}
                onValueChange={(value) =>
                  field.handleChange(value as typeof field.state.value)
                }
              />
            )}
          </form.Field>
          <form.Field name="durationType">
            {(field) => (
              <SegmentedControl
                label={t('create.durationType')}
                items={[...commonOptions.durationType]}
                value={field.state.value}
                onValueChange={(value) =>
                  field.handleChange(value as typeof field.state.value)
                }
              />
            )}
          </form.Field>
        </ResponsiveGrid>
      </FormSection>
      <FormSection
        contained={layout.isWeb}
        leadingIcon="fileUser"
        title={t('create.resume')}
        description={t('create.resumeHelp')}
      >
        <form.Field name="resumeId">
          {(field) => (
            <SearchableSelect
              label={t('create.resume')}
              leadingIcon="fileText"
              placeholder={t('create.noResume')}
              loading={vm.resumes.isLoading}
              error={vm.resumes.isError ? t('error.load') : undefined}
              options={resumeOptions}
              value={field.state.value ?? NONE_RESUME}
              onValueChange={(value) =>
                field.handleChange(value === NONE_RESUME ? null : value)
              }
            />
          )}
        </form.Field>
        <FileUploadField
          label={t('create.uploadResume')}
          acceptedTypes="PDF"
          maxSizeLabel={
            picker.policy.data
              ? `${picker.policy.data.maxSizeBytes / 1024 / 1024} MiB`
              : '—'
          }
          disabled={
            !picker.policy.data ||
            picker.policy.data.usedResumes >= picker.policy.data.maxResumes
          }
          isLoading={vm.upload.isPending}
          progress={vm.uploadProgress}
          error={uploadError ?? undefined}
          onPress={() => void uploadResume()}
        />
      </FormSection>
      <FormSection
        contained={layout.isWeb}
        leadingIcon="circleDollarSign"
        title={t('create.compensation')}
      >
        {compensationFields('expected', t('create.expected'))}
        {compensationFields('offered', t('create.offered'))}
      </FormSection>
      <FormSection
        contained={layout.isWeb}
        leadingIcon="penLine"
        title={t('create.additionalInformation')}
      >
        <form.Field name="privateNotes">
          {(field) => (
            <TextAreaField
              label={t('create.additionalInformationLabel')}
              placeholder={t('create.notesPlaceholder')}
              maxLength={10_000}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChangeText={field.handleChange}
              error={fieldError(field.state.meta.errors, t)}
            />
          )}
        </form.Field>
      </FormSection>
    </>
  );

  const canContinue = (values: typeof applicationCreateDefaults) =>
    Boolean(
      values.companyName.trim() &&
      values.companyName.trim().length <= 120 &&
      values.role.trim() &&
      values.role.trim().length <= 120,
    );

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
            onAdd={() => undefined}
            onPending={notifyPending}
            onSignOut={requestSignOut}
            signingOut={signOutMutation.isPending}
          />
        ) : null}
        <View className="flex-1">
          <TopAppBar
            title={t('create.title')}
            subtitle={layout.isWeb ? t('create.subtitle') : undefined}
            leading={
              <Button
                label="‹"
                accessibilityLabel={t('create.cancel')}
                variant="ghost"
                size="sm"
                onPress={cancel}
              />
            }
          />
          <ScrollView
            className="flex-1"
            contentContainerStyle={{
              alignSelf: 'center',
              gap: 32,
              maxWidth: layout.contentMaxWidth ?? 720,
              paddingHorizontal: layout.pageGutter,
              paddingVertical: layout.isExpanded ? 40 : 24,
              width: '100%',
            }}
            keyboardShouldPersistTaps="handled"
          >
            {layout.isWeb ? (
              <Breadcrumbs
                homeLabel={t('breadcrumb.home')}
                onHomePress={() => router.replace('/')}
                items={[
                  {
                    label: t('nav.applications'),
                    onPress: () => router.replace('/'),
                  },
                  { label: t('create.title') },
                ]}
              />
            ) : null}
            {!layout.isWeb ? (
              <ProgressIndicator
                current={step}
                total={2}
                label={t('create.step', { current: step })}
              />
            ) : null}
            {layout.isWeb || step === 1 ? firstStep : null}
            {layout.isWeb || step === 2 ? secondStep : null}
            {submissionError ? (
              <AppText accessibilityLiveRegion="polite" tone="danger">
                {submissionError}
              </AppText>
            ) : null}
          </ScrollView>
          <Modal
            transparent
            animationType="fade"
            visible={discardAction !== null}
            onRequestClose={() => setDiscardAction(null)}
          >
            <Pressable
              className="flex-1 items-center justify-center bg-black/40 p-6"
              onPress={() => setDiscardAction(null)}
            >
              <Pressable
                accessibilityRole="alert"
                className="w-full max-w-md gap-5 rounded-2xl bg-surface p-6 shadow-lg"
                onPress={() => undefined}
              >
                <View className="gap-2">
                  <AppText variant="sectionTitle">
                    {t('create.leaveTitle')}
                  </AppText>
                  <AppText tone="muted">
                    {t(
                      uploadedResume
                        ? 'create.leaveWithResumeMessage'
                        : 'create.leaveMessage',
                    )}
                  </AppText>
                </View>
                <View className="flex-row justify-end gap-3">
                  <Button
                    label={t('create.keepEditing')}
                    variant="secondary"
                    onPress={() => setDiscardAction(null)}
                  />
                  <Button
                    label={t('create.discard')}
                    variant="destructive"
                    onPress={() => {
                      const action = discardAction;
                      setDiscardAction(null);
                      action?.();
                    }}
                  />
                </View>
              </Pressable>
            </Pressable>
          </Modal>
          <StickyActionBar>
            <Button
              label={t('create.cancel')}
              variant="ghost"
              disabled={vm.create.isPending || vm.upload.isPending}
              onPress={cancel}
            />
            {!layout.isWeb && step === 2 ? (
              <Button
                label={t('create.back')}
                variant="secondary"
                disabled={vm.create.isPending || vm.upload.isPending}
                onPress={() => setStep(1)}
              />
            ) : null}
            {!layout.isWeb && step === 1 ? (
              <form.Subscribe selector={(state) => state.values}>
                {(values) => (
                  <Button
                    label={t('create.next')}
                    disabled={!canContinue(values)}
                    onPress={() => setStep(2)}
                  />
                )}
              </form.Subscribe>
            ) : (
              <form.Subscribe
                selector={(state) => ({
                  canSubmit: state.canSubmit,
                  isDirty: state.isDirty,
                })}
              >
                {({ canSubmit, isDirty }) => {
                  dirtyRef.current = isDirty;
                  return (
                    <Button
                      label={t('create.save')}
                      leadingIcon="stickyNoteCheck"
                      loading={vm.create.isPending}
                      disabled={!canSubmit || vm.upload.isPending}
                      onPress={() => form.handleSubmit()}
                    />
                  );
                }}
              </form.Subscribe>
            )}
          </StickyActionBar>
          {!layout.isWeb && step === 1 ? (
            <form.Subscribe selector={(state) => state.isDirty}>
              {(isDirty) => {
                dirtyRef.current = isDirty;
                return null;
              }}
            </form.Subscribe>
          ) : null}
        </View>
      </View>
    </Screen>
  );
}

function fieldError(errors: readonly unknown[], t: (key: string) => string) {
  if (!errors.length) return undefined;
  const first = errors[0];
  const message =
    typeof first === 'string'
      ? first
      : first instanceof Error
        ? first.message
        : first && typeof first === 'object' && 'message' in first
          ? String(first.message)
          : undefined;
  if (message?.startsWith('validation.')) return t(message);
  if (message === 'salary.invalid') return t('validation.salary.format');
  if (message === 'salary.precision') return t('validation.salary.precision');
  if (message === 'salary.range') return t('validation.salary.range');
  return t('validation.generic');
}

import { Linking, Modal, Pressable, ScrollView, View } from 'react-native';
import { useState, type ReactNode } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import {
  AppText,
  Badge,
  Button,
  CollectionFeedback,
  DatePickerField,
  Notice,
  ResourceRow,
  Screen,
  Surface,
  Tabs,
  TopAppBar,
  useResponsiveLayout,
  useSnackbar,
} from '@palea/ui-native';
import { currencyCatalog, type Resume } from '@palea/contracts';
import type {
  ApplicationDetail,
  ApplicationResource,
  ApplicationStage,
  ApplicationStatus,
} from '../../domain/entities/Application';
import { useLocale } from '@/core/localization/LocaleProvider';
import { PostAuthRouteGuard } from '@/features/auth/presentation/components/PostAuthRouteGuard';
import { todayLocal } from '../create/applicationCreateModel';
import { ReadOnlyHtml } from '../detail/ReadOnlyHtml';
import { useApplicationDetailViewModel } from '../detail/useApplicationDetailViewModel';

const statuses: ApplicationStatus[] = [
  'draft',
  'applied',
  'interview',
  'offer',
  'rejected',
];
type ViewModel = ReturnType<typeof useApplicationDetailViewModel>;
type Translate = ReturnType<typeof useLocale>['t'];
type ApplicationCompensation = ApplicationDetail['compensations'][number];

export function ApplicationDetailScreen() {
  return (
    <PostAuthRouteGuard>
      <ApplicationDetailContent />
    </PostAuthRouteGuard>
  );
}

function ApplicationDetailContent() {
  const { applicationId } = useLocalSearchParams<{ applicationId: string }>();
  const router = useRouter();
  const layout = useResponsiveLayout();
  const { t, i18n } = useLocale('applications');
  const { showSnackbar } = useSnackbar();
  const vm = useApplicationDetailViewModel(applicationId ?? '');
  const [tab, setTab] = useState<'summary' | 'stages'>('summary');
  const [statusOpen, setStatusOpen] = useState(false);
  const [resumeOpen, setResumeOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<ApplicationStatus | null>(
    null,
  );
  const [moveDate, setMoveDate] = useState<string | null>(todayLocal());
  if (!applicationId || (vm.detail.error && !vm.detail.data)) {
    return (
      <Screen>
        <CollectionFeedback
          status="error"
          title={t('detail.notFound')}
          message={t('error.load')}
          actionLabel={t('detail.back')}
          onAction={() => router.replace('/')}
        />
      </Screen>
    );
  }
  if (vm.detail.isLoading || !vm.detail.data)
    return (
      <Screen>
        <CollectionFeedback status="loading" rows={5} />
      </Screen>
    );
  const application = vm.detail.data;
  const commitStatus = async (
    status: ApplicationStatus,
    appliedOn?: string,
  ) => {
    try {
      await vm.status.mutateAsync([
        applicationId,
        status,
        undefined,
        appliedOn,
      ]);
      showSnackbar({ variant: 'success', message: t('feedback.moved') });
    } catch {
      showSnackbar({ variant: 'error', message: t('error.move') });
    }
  };
  const changeStatus = (status: ApplicationStatus) => {
    setStatusOpen(false);
    if (
      application.status === 'draft' &&
      status !== 'draft' &&
      !application.appliedOn
    ) {
      setMoveDate(todayLocal());
      setPendingStatus(status);
      return;
    }
    void commitStatus(status);
  };
  const download = async () => {
    if (!application.resume) return;
    try {
      const url = await vm.download.mutateAsync(application.resume.id);
      await Linking.openURL(url);
    } catch {
      showSnackbar({ variant: 'error', message: t('detail.downloadError') });
    }
  };
  const upload = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/pdf',
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets[0]) return;
    try {
      const asset = result.assets[0];
      const bytes = new Uint8Array(
        await (await fetch(asset.uri)).arrayBuffer(),
      );
      const sizeBytes = asset.size ?? bytes.byteLength;
      if (sizeBytes > 10 * 1024 * 1024) throw new Error('resume.maxSize');
      await vm.upload.mutateAsync({
        name: asset.name,
        mimeType: 'application/pdf',
        sizeBytes,
        readBytes: async () => bytes,
      });
      setResumeOpen(false);
      showSnackbar({ variant: 'success', message: t('detail.resumeUpdated') });
    } catch {
      showSnackbar({ variant: 'error', message: t('create.uploadError') });
    }
  };
  const selectResume = async (resumeId: string | null) => {
    try {
      await vm.resume.mutateAsync(resumeId);
      setResumeOpen(false);
      showSnackbar({ variant: 'success', message: t('detail.resumeUpdated') });
    } catch {
      showSnackbar({ variant: 'error', message: t('detail.resumeError') });
    }
  };
  const summary = (
    <Summary
      application={application}
      vm={vm}
      t={t}
      locale={i18n.language}
      onStatus={() => setStatusOpen(true)}
      onResume={() => setResumeOpen(true)}
      onDownload={download}
      onResource={(url: string) =>
        void Linking.openURL(url).catch(() =>
          showSnackbar({
            variant: 'error',
            message: t('detail.resourceError'),
          }),
        )
      }
    />
  );
  const stages = <Stages vm={vm} t={t} locale={i18n.language} />;
  return (
    <Screen edges={['bottom']}>
      <TopAppBar
        title={application.role}
        leading={
          <Button
            label="‹"
            accessibilityLabel={t('detail.back')}
            variant="ghost"
            onPress={() => router.back()}
          />
        }
      />
      {!layout.isExpanded ? (
        <Tabs
          accessibilityLabel={t('detail.tabs')}
          value={tab}
          onValueChange={(value) => setTab(value as 'summary' | 'stages')}
          items={[
            { value: 'summary', label: t('detail.summary') },
            { value: 'stages', label: t('detail.stages') },
          ]}
        />
      ) : null}
      <ScrollView
        contentContainerClassName="gap-4 px-4 py-5"
        contentContainerStyle={{
          maxWidth: layout.contentMaxWidth ?? 1200,
          width: '100%',
          alignSelf: 'center',
        }}
      >
        {layout.isExpanded ? (
          <View className="flex-row items-start gap-4">
            <View className="flex-1">{summary}</View>
            <View className="flex-1">{stages}</View>
          </View>
        ) : tab === 'summary' ? (
          summary
        ) : (
          stages
        )}
      </ScrollView>
      <StatusModal
        visible={statusOpen}
        current={application.status}
        labels={statuses.map((status) => ({
          status,
          label: t(`status.${status}`),
        }))}
        onClose={() => setStatusOpen(false)}
        onSelect={changeStatus}
      />
      <ResumeModal
        visible={resumeOpen}
        resumes={vm.resumes.data ?? []}
        selected={application.resume?.id ?? null}
        busy={vm.resume.isPending || vm.upload.isPending}
        labels={{
          title: t('detail.chooseResume'),
          none: t('create.noResume'),
          upload: t('create.uploadResume'),
          cancel: t('actions.cancel'),
        }}
        onClose={() => setResumeOpen(false)}
        onSelect={selectResume}
        onUpload={upload}
      />
      <DateModal
        visible={pendingStatus !== null}
        value={moveDate}
        t={t}
        onClose={() => setPendingStatus(null)}
        onChange={setMoveDate}
        onConfirm={() => {
          if (!pendingStatus || !moveDate) return;
          const requestedStatus = pendingStatus;
          setPendingStatus(null);
          void commitStatus(requestedStatus, moveDate);
        }}
      />
    </Screen>
  );
}

interface SummaryProps {
  application: ApplicationDetail;
  vm: ViewModel;
  t: Translate;
  locale: string;
  onStatus: () => void;
  onResume: () => void;
  onDownload: () => void;
  onResource: (url: string) => void;
}

function Summary({
  application,
  vm,
  t,
  locale,
  onStatus,
  onResume,
  onDownload,
  onResource,
}: SummaryProps) {
  const unspecified = t('detail.unspecified');
  return (
    <View className="gap-4">
      <Surface className="gap-3">
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1">
            <AppText variant="screenTitle">{application.role}</AppText>
            <AppText tone="muted">{application.companyName}</AppText>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('detail.changeStatus')}
            className="min-h-touch-target justify-center"
            onPress={onStatus}
          >
            <Badge label={t(`status.${application.status}`)} tone="info" />
          </Pressable>
        </View>
        <DetailRow
          label={t('create.date')}
          value={
            application.appliedOn
              ? new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(
                  new Date(`${application.appliedOn}T12:00:00`),
                )
              : unspecified
          }
        />
        <DetailRow
          label={t('create.workMode')}
          value={t(`workMode.${application.workMode}`)}
        />
        <DetailRow
          label={t('create.commitment')}
          value={
            application.commitment === 'unspecified'
              ? unspecified
              : t(
                  `create.${application.commitment === 'full_time' ? 'fullTime' : 'partTime'}`,
                )
          }
        />
        <DetailRow
          label={t('create.contractType')}
          value={
            application.contractType === 'unspecified'
              ? unspecified
              : t(`create.${application.contractType}`)
          }
        />
        <DetailRow
          label={t('create.durationType')}
          value={
            application.durationType === 'unspecified'
              ? unspecified
              : t(`create.${application.durationType}`)
          }
        />
        <DetailRow
          label={t('detail.location')}
          value={application.location ?? unspecified}
        />
        <DetailRow
          label={t('detail.schedule')}
          value={application.schedule ?? unspecified}
        />
      </Surface>
      <Module title={t('create.compensation')}>
        <Compensations
          items={application.compensations}
          t={t}
          locale={locale}
        />
      </Module>
      <Module title={t('create.description')}>
        {application.descriptionHtml ? (
          <ReadOnlyHtml html={application.descriptionHtml} />
        ) : (
          <AppText tone="muted">{unspecified}</AppText>
        )}
      </Module>
      <Module title={t('create.skills')}>
        <Skills
          status={application.skillAnalysisStatus}
          skills={application.requiredSkills}
          t={t}
          locale={locale}
        />
      </Module>
      <Module title={t('create.resume')}>
        <ResourceRow
          title={application.resume?.displayName ?? t('create.noResume')}
          subtitle={
            application.resume?.isPrimary
              ? t('detail.primaryResume')
              : undefined
          }
          icon="fileText"
          actionLabel={t('detail.chooseResume')}
          onPress={onResume}
        />
        {application.resume ? (
          <Button
            label={t('detail.download')}
            variant="secondary"
            loading={vm.download.isPending}
            onPress={onDownload}
          />
        ) : null}
      </Module>
      <Module title={t('create.notes')}>
        <Note vm={vm} t={t} locale={locale} />
      </Module>
      <Module title={t('detail.resources')}>
        <Resources vm={vm} t={t} onOpen={onResource} />
      </Module>
    </View>
  );
}

function Stages({
  vm,
  t,
  locale,
}: {
  vm: ViewModel;
  t: Translate;
  locale: string;
}) {
  if (vm.stages.isLoading)
    return <CollectionFeedback status="loading" rows={3} />;
  if (vm.stages.error)
    return (
      <CollectionFeedback
        status="error"
        title={t('error.title')}
        message={t('error.load')}
        actionLabel={t('error.retry')}
        onAction={() => vm.stages.refetch()}
      />
    );
  return (
    <Module title={t('detail.stages')}>
      {vm.stages.data?.length ? (
        vm.stages.data.map((stage: ApplicationStage) => (
          <Surface key={stage.id} variant="subtle" className="gap-1">
            <AppText variant="bodySmall">{stage.name}</AppText>
            <AppText variant="label" tone="muted">
              {stage.eventOn
                ? new Intl.DateTimeFormat(locale, {
                    dateStyle: 'medium',
                  }).format(new Date(`${stage.eventOn}T12:00:00`))
                : t('detail.unspecified')}
            </AppText>
            {stage.details ? <AppText>{stage.details}</AppText> : null}
          </Surface>
        ))
      ) : (
        <Notice
          title={t('detail.noStages')}
          message={t('detail.noStagesMessage')}
        />
      )}
    </Module>
  );
}
function Note({
  vm,
  t,
  locale,
}: {
  vm: ViewModel;
  t: Translate;
  locale: string;
}) {
  if (vm.note.isLoading)
    return <CollectionFeedback status="loading" rows={1} />;
  if (vm.note.error)
    return (
      <CollectionFeedback
        status="error"
        title={t('error.title')}
        message={t('error.load')}
        actionLabel={t('error.retry')}
        onAction={() => vm.note.refetch()}
      />
    );
  return vm.note.data ? (
    <View className="gap-2">
      {vm.note.data.body.split('\n').map((line, index) => (
        <AppText key={`${index}-${line}`}>{line || ' '}</AppText>
      ))}
      <AppText variant="label" tone="muted">
        {t('detail.updated', {
          date: new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(
            new Date(vm.note.data.updatedAt),
          ),
        })}
      </AppText>
    </View>
  ) : (
    <Notice title={t('detail.noNote')} message={t('detail.noNoteMessage')} />
  );
}
function Resources({
  vm,
  t,
  onOpen,
}: {
  vm: ViewModel;
  t: Translate;
  onOpen: (url: string) => void;
}) {
  if (vm.resources.isLoading)
    return <CollectionFeedback status="loading" rows={2} />;
  if (vm.resources.error)
    return (
      <CollectionFeedback
        status="error"
        title={t('error.title')}
        message={t('error.load')}
        actionLabel={t('error.retry')}
        onAction={() => vm.resources.refetch()}
      />
    );
  return vm.resources.data?.length ? (
    <View className="gap-2">
      {vm.resources.data.map((resource: ApplicationResource) => (
        <ResourceRow
          key={resource.id}
          title={resource.name}
          subtitle={resource.resourceType ?? resource.url}
          icon="link"
          actionLabel={t('detail.openResource')}
          onPress={() => onOpen(resource.url)}
        />
      ))}
    </View>
  ) : (
    <Notice
      title={t('detail.noResources')}
      message={t('detail.noResourcesMessage')}
    />
  );
}
function Skills({
  status,
  skills,
  t,
  locale,
}: {
  status: ApplicationDetail['skillAnalysisStatus'];
  skills: ApplicationDetail['requiredSkills'];
  t: Translate;
  locale: string;
}) {
  if (skills.length)
    return (
      <View className="flex-row flex-wrap gap-2">
        {skills.map((skill) => (
          <Badge
            key={skill.id}
            label={locale.startsWith('es') ? skill.labelEs : skill.labelEn}
            tone="neutral"
          />
        ))}
      </View>
    );
  return (
    <Notice
      title={t(`detail.skills.${status}.title`)}
      message={t(`detail.skills.${status}.message`)}
    />
  );
}
function Compensations({
  items,
  t,
  locale,
}: {
  items: ApplicationDetail['compensations'];
  t: Translate;
  locale: string;
}) {
  if (!items.length)
    return <AppText tone="muted">{t('detail.unspecified')}</AppText>;
  return (
    <View className="gap-2">
      {items.map((item) => (
        <DetailRow
          key={item.kind}
          label={
            item.kind === 'expected'
              ? t('create.expected')
              : t('create.offered')
          }
          value={formatCompensation(item, locale)}
        />
      ))}
    </View>
  );
}
function formatCompensation(item: ApplicationCompensation, locale: string) {
  const value = item.minimumMinor ?? item.maximumMinor;
  if (!value) return '—';
  const exponent =
    currencyCatalog.find((currency) => currency.code === item.currency)
      ?.exponent ?? 2;
  const format = (minor: string) =>
    new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: item.currency,
    }).format(Number(minor) / 10 ** exponent);
  const base = format(value);
  return item.minimumMinor &&
    item.maximumMinor &&
    item.minimumMinor !== item.maximumMinor
    ? `${base} – ${format(item.maximumMinor)} / ${item.period}`
    : `${base} / ${item.period}`;
}
function Module({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Surface className="gap-3">
      <AppText variant="sectionTitle">{title}</AppText>
      {children}
    </Surface>
  );
}
function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between gap-4">
      <AppText variant="label" tone="muted">
        {label}
      </AppText>
      <AppText className="flex-1 text-right">{value}</AppText>
    </View>
  );
}
function StatusModal({
  visible,
  current,
  labels,
  onClose,
  onSelect,
}: {
  visible: boolean;
  current: ApplicationStatus;
  labels: { status: ApplicationStatus; label: string }[];
  onClose: () => void;
  onSelect: (status: ApplicationStatus) => void;
}) {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1 items-center justify-center bg-black/20 px-6"
        onPress={onClose}
      >
        <Pressable
          accessibilityViewIsModal
          className="w-full max-w-md gap-3 rounded-md bg-white p-5"
          onPress={(event) => event.stopPropagation()}
        >
          {labels.map(({ status, label }) => (
            <Button
              key={status}
              label={label}
              variant={status === current ? 'primary' : 'secondary'}
              onPress={() => onSelect(status)}
            />
          ))}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
function ResumeModal({
  visible,
  resumes,
  selected,
  busy,
  labels,
  onClose,
  onSelect,
  onUpload,
}: {
  visible: boolean;
  resumes: Resume[];
  selected: string | null;
  busy: boolean;
  labels: { title: string; none: string; upload: string; cancel: string };
  onClose: () => void;
  onSelect: (resumeId: string | null) => void;
  onUpload: () => Promise<void>;
}) {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1 items-center justify-center bg-black/20 px-6"
        onPress={onClose}
      >
        <Pressable
          accessibilityViewIsModal
          className="w-full max-w-md gap-3 rounded-md bg-white p-5"
          onPress={(event) => event.stopPropagation()}
        >
          <AppText variant="sectionTitle">{labels.title}</AppText>
          <Button
            label={labels.none}
            variant={selected === null ? 'primary' : 'secondary'}
            disabled={busy}
            onPress={() => onSelect(null)}
          />
          {resumes.map((resume) => (
            <Button
              key={resume.id}
              label={resume.displayName}
              variant={selected === resume.id ? 'primary' : 'secondary'}
              disabled={busy}
              onPress={() => onSelect(resume.id)}
            />
          ))}
          <Button
            label={labels.upload}
            variant="secondary"
            loading={busy}
            onPress={() => void onUpload()}
          />
          <Button label={labels.cancel} variant="ghost" onPress={onClose} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}
function DateModal({
  visible,
  value,
  t,
  onClose,
  onChange,
  onConfirm,
}: {
  visible: boolean;
  value: string | null;
  t: Translate;
  onClose: () => void;
  onChange: (value: string | null) => void;
  onConfirm: () => void;
}) {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1 items-center justify-center bg-black/20 px-6"
        onPress={onClose}
      >
        <Pressable
          accessibilityViewIsModal
          className="w-full max-w-md gap-5 rounded-md bg-white p-5"
          onPress={(event) => event.stopPropagation()}
        >
          <View className="gap-1">
            <AppText variant="sectionTitle">{t('moveDate.title')}</AppText>
            <AppText tone="muted">{t('moveDate.message')}</AppText>
          </View>
          <DatePickerField
            label={t('create.date')}
            value={value}
            maximum={todayLocal()}
            placeholder={t('create.datePlaceholder')}
            clearLabel={t('create.clearDate')}
            cancelLabel={t('create.cancel')}
            confirmLabel={t('create.confirm')}
            onChange={onChange}
          />
          <View className="flex-row justify-end gap-2">
            <Button
              label={t('create.cancel')}
              variant="ghost"
              onPress={onClose}
            />
            <Button
              label={t('moveDate.confirm')}
              disabled={!value}
              onPress={onConfirm}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

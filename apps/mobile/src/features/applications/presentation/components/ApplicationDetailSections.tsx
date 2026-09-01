import { Pressable, View } from 'react-native';
import type { ReactNode } from 'react';
import {
  AppText,
  Badge,
  Button,
  CollectionFeedback,
  Icon,
  IconButton,
  ResourceRow,
  ResponsiveGrid,
  StageTimeline,
  Surface,
} from '@palea/ui-native';
import { currencyCatalog } from '@palea/contracts';
import type {
  ApplicationDetail,
  ApplicationResource,
  ApplicationStage,
} from '../../domain/entities/Application';
import { useLocale } from '@/core/localization/LocaleProvider';
import { ReadOnlyHtml } from '../detail/ReadOnlyHtml';
import { isPendingStageDue } from '../stages/applicationStageModel';

type Loadable<T> = {
  data: T | undefined;
  isLoading: boolean;
  error: unknown;
  onRetry: () => void;
};

export function ApplicationDetailSummary({
  application,
  note,
  resources,
  includeNote,
  includeDetails = true,
  includeResources = true,
}: {
  application: ApplicationDetail;
  note: ReactNode;
  resources: ReactNode;
  includeNote: boolean;
  includeDetails?: boolean;
  includeResources?: boolean;
}) {
  const { t, i18n } = useLocale('applications');
  const unspecified = t('detail.unspecified');
  return (
    <View className="gap-6">
      {includeDetails ? (
        <>
          <Section title={t('create.details')} icon="briefcase">
            <ResponsiveGrid columns={{ compact: 1, medium: 2, expanded: 3 }}>
              <Metric
                icon="calendar"
                label={t('create.date')}
                value={
                  application.appliedOn
                    ? new Intl.DateTimeFormat(i18n.language, {
                        dateStyle: 'medium',
                      }).format(new Date(`${application.appliedOn}T12:00:00`))
                    : unspecified
                }
              />
              <Metric
                icon="briefcase"
                label={t('create.workMode')}
                value={t(`workMode.${application.workMode}`)}
              />
              <Metric
                icon="fileText"
                label={t('create.commitment')}
                value={
                  application.commitment === 'unspecified'
                    ? unspecified
                    : t(
                        `create.${application.commitment === 'full_time' ? 'fullTime' : 'partTime'}`,
                      )
                }
              />
              <Metric
                icon="file"
                label={t('create.contractType')}
                value={
                  application.contractType === 'unspecified'
                    ? unspecified
                    : t(`create.${application.contractType}`)
                }
              />
              <Metric
                icon="time"
                label={t('create.durationType')}
                value={
                  application.durationType === 'unspecified'
                    ? unspecified
                    : t(`create.${application.durationType}`)
                }
              />
              <Metric
                icon="location"
                label={t('detail.location')}
                value={application.location ?? unspecified}
              />
              <Metric
                icon="time"
                label={t('detail.schedule')}
                value={application.schedule ?? unspecified}
              />
            </ResponsiveGrid>
            <View className="gap-3 border-t border-border pt-4 dark:border-dark-border">
              <View className="flex-row items-center gap-2">
                <Icon name="banknote" size="sm" tone="muted" />
                <AppText variant="bodySmall" className="font-semibold">
                  {t('create.compensation')}
                </AppText>
              </View>
              <Compensations items={application.compensations} />
            </View>
          </Section>
          <Section title={t('create.description')} icon="fileText">
            {application.descriptionHtml ? (
              <ReadOnlyHtml html={application.descriptionHtml} />
            ) : (
              <AppText tone="muted">{unspecified}</AppText>
            )}
          </Section>
          <Section title={t('create.skills')} icon="star">
            <Skills application={application} />
          </Section>
        </>
      ) : null}
      {includeNote ? (
        <Section title={t('create.notes')} icon="notes">
          {note}
        </Section>
      ) : null}
      {includeResources ? (
        <Section title={t('detail.resources')} icon="link">
          {resources}
        </Section>
      ) : null}
    </View>
  );
}

export function ApplicationStagesSection({
  state,
  onAdd,
  onOpen,
  onEdit,
}: {
  state: Loadable<ApplicationStage[]>;
  onAdd: () => void;
  onOpen: (stageId: string) => void;
  onEdit: (stageId: string) => void;
}) {
  const { t, i18n } = useLocale('applications');
  if (state.isLoading) return <CollectionFeedback status="loading" rows={3} />;
  if (state.error)
    return (
      <CollectionFeedback
        status="error"
        title={t('error.title')}
        message={t('error.load')}
        actionLabel={t('error.retry')}
        onAction={state.onRetry}
      />
    );
  return (
    <Section
      title={t('detail.stages')}
      icon="circleDashed"
      action={
        <Button
          label={t('stages.add')}
          leadingIcon="add"
          variant="secondary"
          size="sm"
          style={{ minHeight: 48 }}
          onPress={onAdd}
        />
      }
    >
      {state.data?.length ? (
        <StageTimeline
          items={state.data.map((stage, index) => ({
            id: stage.id,
            title: stage.name,
            date: stage.eventOn
              ? new Intl.DateTimeFormat(i18n.language, {
                  dateStyle: 'medium',
                }).format(new Date(`${stage.eventOn}T12:00:00`))
              : t('detail.unspecified'),
            completed: stage.result !== 'pending',
            current: index === 0,
            currentLabel: index === 0 ? t('stages.current') : undefined,
            statusLabel: t(`stages.result.${stage.result}`),
            tone:
              stage.result === 'successful'
                ? 'success'
                : stage.result === 'failed'
                  ? 'danger'
                  : 'warning',
            warningLabel: isPendingStageDue(stage)
              ? t('stages.warning.short')
              : undefined,
            warningActionLabel: isPendingStageDue(stage)
              ? t('stages.warning.action')
              : undefined,
            onWarningPress: () => onEdit(stage.id),
            actionLabel: t('stages.open', { name: stage.name }),
            onPress: () => onOpen(stage.id),
          }))}
        />
      ) : (
        <CollectionFeedback
          status="empty"
          title={t('detail.noStages')}
          message={t('detail.noStagesMessage')}
        />
      )}
    </Section>
  );
}

export function ApplicationNote({
  state,
}: {
  state: Loadable<{ body: string; updatedAt: string } | null>;
}) {
  const { t, i18n } = useLocale('applications');
  if (state.isLoading) return <CollectionFeedback status="loading" rows={1} />;
  if (state.error)
    return (
      <CollectionFeedback
        status="error"
        title={t('error.title')}
        message={t('error.load')}
        actionLabel={t('error.retry')}
        onAction={state.onRetry}
      />
    );
  if (!state.data)
    return (
      <CollectionFeedback
        status="empty"
        title={t('detail.noNote')}
        message={t('detail.noNoteMessage')}
      />
    );
  return (
    <View className="gap-2">
      {state.data.body.split('\n').map((line, index) => (
        <AppText key={`${index}-${line}`}>{line || ' '}</AppText>
      ))}
      <AppText variant="label" tone="muted">
        {t('detail.updated', {
          date: new Intl.DateTimeFormat(i18n.language, {
            dateStyle: 'medium',
          }).format(new Date(state.data.updatedAt)),
        })}
      </AppText>
    </View>
  );
}

export function ApplicationResources({
  state,
  resume,
  downloadPending,
  onChooseResume,
  onPreviewResume,
  onDownload,
  onOpen,
}: {
  state: Loadable<ApplicationResource[]>;
  resume: ApplicationDetail['resume'];
  downloadPending: boolean;
  onChooseResume: () => void;
  onPreviewResume: () => void;
  onDownload: () => void;
  onOpen: (url: string) => void;
}) {
  const { t } = useLocale('applications');
  const resources = state.data ?? [];
  return (
    <View className="gap-3">
      {resume ? (
        <ResumeRow
          title={resume.displayName}
          subtitle={resume.isPrimary ? t('detail.primaryResume') : undefined}
          chooseLabel={t('detail.chooseResume')}
          downloadLabel={t('detail.download')}
          pending={downloadPending}
          onChoose={onChooseResume}
          onPreview={onPreviewResume}
          onDownload={onDownload}
        />
      ) : null}
      {!resume && resources.length > 0 ? (
        <Button
          label={t('detail.chooseResume')}
          leadingIcon="fileText"
          variant="secondary"
          onPress={onChooseResume}
        />
      ) : null}
      {state.isLoading ? (
        <CollectionFeedback status="loading" rows={2} />
      ) : null}
      {state.error ? (
        <CollectionFeedback
          status="error"
          title={t('error.title')}
          message={t('error.load')}
          actionLabel={t('error.retry')}
          onAction={state.onRetry}
        />
      ) : null}
      {!state.isLoading && !state.error && resources.length ? (
        <View className="gap-2">
          {resources.map((resource) => (
            <ResourceRow
              key={resource.id}
              title={resource.name}
              typeLabel={resource.resourceType ?? t('detail.resourceTypeLink')}
              subtitle={resource.url}
              icon="link"
              actionLabel={t('detail.openResource')}
              onPress={() => onOpen(resource.url)}
            />
          ))}
        </View>
      ) : null}
      {!state.isLoading && !state.error && !resume && !resources.length ? (
        <CollectionFeedback
          status="empty"
          title={t('detail.noResources')}
          message={t('detail.noResourcesMessage')}
          actionLabel={t('detail.chooseResume')}
          onAction={onChooseResume}
        />
      ) : null}
    </View>
  );
}

function ResumeRow({
  title,
  subtitle,
  chooseLabel,
  downloadLabel,
  pending,
  onChoose,
  onPreview,
  onDownload,
}: {
  title: string;
  subtitle?: string;
  chooseLabel: string;
  downloadLabel: string;
  pending: boolean;
  onChoose: () => void;
  onPreview: () => void;
  onDownload: () => void;
}) {
  const { t: resumeT } = useLocale('resumes');
  return (
    <View className="min-h-control-md flex-row items-center gap-3 rounded-sm bg-surface-subtle/60 px-3 py-3 dark:bg-dark-surface-subtle/60">
      <View className="h-10 w-10 shrink-0 items-center justify-center rounded-sm border border-interaction bg-interaction-subtle dark:border-dark-interaction dark:bg-dark-interaction-subtle">
        <Icon name="fileUser" size="md" tone="interaction" />
      </View>
      <Pressable
        accessibilityLabel={resumeT('open', { name: title })}
        accessibilityRole="button"
        className="min-w-0 flex-1 gap-0.5 rounded-sm py-1"
        onPress={onPreview}
      >
        <AppText
          variant="bodySmall"
          className="flex-shrink font-semibold"
          numberOfLines={2}
        >
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="label" tone="muted" numberOfLines={1}>
            {subtitle}
          </AppText>
        ) : null}
      </Pressable>
      <IconButton
        icon="edit"
        accessibilityLabel={chooseLabel}
        onPress={onChoose}
      />
      <IconButton
        icon="download"
        accessibilityLabel={downloadLabel}
        disabled={pending}
        onPress={onDownload}
      />
    </View>
  );
}

function Skills({ application }: { application: ApplicationDetail }) {
  const { t, i18n } = useLocale('applications');
  if (application.requiredSkills.length)
    return (
      <View className="flex-row flex-wrap gap-2">
        {application.requiredSkills.map((skill) => (
          <Badge
            key={skill.id}
            label={
              i18n.language.startsWith('es') ? skill.labelEs : skill.labelEn
            }
            tone="neutral"
          />
        ))}
      </View>
    );
  return (
    <CollectionFeedback
      status="empty"
      title={t(`detail.skills.${application.skillAnalysisStatus}.title`)}
      message={t(`detail.skills.${application.skillAnalysisStatus}.message`)}
    />
  );
}
function Compensations({
  items,
}: {
  items: ApplicationDetail['compensations'];
}) {
  const { t, i18n } = useLocale('applications');
  if (!items.length)
    return <AppText tone="muted">{t('detail.unspecified')}</AppText>;
  return (
    <View className="gap-2">
      {items.map((item) => (
        <View key={item.kind} className="gap-1 py-1">
          <View className="flex-row flex-wrap items-center gap-2">
            <AppText variant="label" tone="muted">
              {item.kind === 'expected'
                ? t('create.expected')
                : t('create.offered')}
            </AppText>
            <Badge label={t(`create.period.${item.period}`)} tone="neutral" />
          </View>
          <AppText variant="bodySmall" className="font-semibold">
            {formatCompensation(item, i18n.language)}
          </AppText>
        </View>
      ))}
    </View>
  );
}
function formatCompensation(
  item: ApplicationDetail['compensations'][number],
  locale: string,
) {
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
  return item.minimumMinor &&
    item.maximumMinor &&
    item.minimumMinor !== item.maximumMinor
    ? `${format(value)} – ${format(item.maximumMinor)}`
    : format(value);
}
function Section({
  title,
  icon,
  action,
  children,
}: {
  title: string;
  icon: Parameters<typeof Icon>[0]['name'];
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Surface padding="lg" className="gap-4">
      <View className="flex-row items-center justify-between gap-3">
        <View className="min-w-0 flex-1 flex-row items-center gap-2">
          <Icon name={icon} size="md" tone="muted" />
          <AppText accessibilityRole="header" variant="sectionTitle">
            {title}
          </AppText>
        </View>
        {action}
      </View>
      {children}
    </Surface>
  );
}
function Metric({
  icon,
  label,
  value,
}: {
  icon: Parameters<typeof Icon>[0]['name'];
  label: string;
  value: string;
}) {
  return (
    <View className="min-h-16 gap-1 px-1 py-2">
      <View className="flex-row items-center gap-2">
        <Icon name={icon} size="sm" tone="muted" />
        <AppText variant="label" tone="muted">
          {label}
        </AppText>
      </View>
      <AppText variant="bodySmall" className="font-semibold">
        {value}
      </AppText>
    </View>
  );
}

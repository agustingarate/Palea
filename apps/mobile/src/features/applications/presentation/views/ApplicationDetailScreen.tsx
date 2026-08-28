import { ScrollView, View } from 'react-native';
import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  CollectionFeedback,
  Screen,
  Tabs,
  useResponsiveLayout,
  useSnackbar,
} from '@palea/ui-native';
import { useLocale } from '@/core/localization/LocaleProvider';
import { useSignOut } from '@/core/session/useSignOut';
import { PostAuthRouteGuard } from '@/features/auth/presentation/components/PostAuthRouteGuard';
import { ApplicationDetailHeader } from '../components/ApplicationDetailHeader';
import { ApplicationDetailModals } from '../components/ApplicationDetailModals';
import { ApplicationsDesktopNavigation } from '../components/ApplicationsNavigation';
import {
  ApplicationDetailSummary,
  ApplicationNote,
  ApplicationResources,
  ApplicationStagesSection,
} from '../components/ApplicationDetailSections';
import {
  applicationStatuses,
  useApplicationDetailInteractions,
} from '../detail/useApplicationDetailInteractions';
import { useApplicationDetailViewModel } from '../detail/useApplicationDetailViewModel';
import { navigateToApplicationsHome } from '../navigation/applicationsHomeNavigation';

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
  const { t } = useLocale('applications');
  const vm = useApplicationDetailViewModel(applicationId ?? '');

  if (!applicationId || (vm.detail.error && !vm.detail.data)) {
    return (
      <Screen>
        <CollectionFeedback
          status="error"
          title={t('detail.notFound')}
          message={t('error.load')}
          actionLabel={t('detail.back')}
          onAction={() => navigateToApplicationsHome(router)}
        />
      </Screen>
    );
  }

  if (vm.detail.isLoading || !vm.detail.data) {
    return (
      <Screen>
        <CollectionFeedback status="loading" rows={5} />
      </Screen>
    );
  }

  return (
    <ApplicationDetailLoadedContent
      applicationId={applicationId}
      application={vm.detail.data}
      stages={vm.stages}
      note={vm.note}
      resources={vm.resources}
      resumes={vm.resumes.data ?? []}
      mutations={{
        updateStatus: vm.status.mutateAsync,
        updateResume: vm.resume.mutateAsync,
        uploadResume: vm.upload.mutateAsync,
        createDownload: vm.download.mutateAsync,
        removeApplication: vm.remove.mutateAsync,
      }}
      downloadPending={vm.download.isPending}
      resumePending={vm.resume.isPending || vm.upload.isPending}
      deleting={vm.remove.isPending}
    />
  );
}

function ApplicationDetailLoadedContent({
  applicationId,
  application,
  stages: stagesQuery,
  note: noteQuery,
  resources: resourcesQuery,
  resumes,
  mutations,
  downloadPending,
  resumePending,
  deleting,
}: {
  applicationId: string;
  application: NonNullable<
    ReturnType<typeof useApplicationDetailViewModel>['detail']['data']
  >;
  stages: ReturnType<typeof useApplicationDetailViewModel>['stages'];
  note: ReturnType<typeof useApplicationDetailViewModel>['note'];
  resources: ReturnType<typeof useApplicationDetailViewModel>['resources'];
  resumes: NonNullable<
    ReturnType<typeof useApplicationDetailViewModel>['resumes']['data']
  >;
  mutations: Parameters<
    typeof useApplicationDetailInteractions
  >[0]['mutations'];
  downloadPending: boolean;
  resumePending: boolean;
  deleting: boolean;
}) {
  const router = useRouter();
  const layout = useResponsiveLayout();
  const { t } = useLocale('applications');
  const { showSnackbar } = useSnackbar();
  const signOutMutation = useSignOut();
  const [tab, setTab] = useState<'summary' | 'stages'>('summary');
  const interactions = useApplicationDetailInteractions({
    applicationId,
    application,
    mutations,
  });
  const noteSection = (
    <ApplicationNote
      state={{
        data: noteQuery.data,
        isLoading: noteQuery.isLoading,
        error: noteQuery.error,
        onRetry: noteQuery.refetch,
      }}
    />
  );
  const resourcesSection = (
    <ApplicationResources
      state={{
        data: resourcesQuery.data,
        isLoading: resourcesQuery.isLoading,
        error: resourcesQuery.error,
        onRetry: resourcesQuery.refetch,
      }}
      resume={application.resume}
      downloadPending={downloadPending}
      onChooseResume={() => interactions.setResumeOpen(true)}
      onDownload={() => void interactions.downloadResume()}
      onOpen={interactions.openResource}
    />
  );
  const summary = (
    <ApplicationDetailSummary
      application={application}
      includeNote={!layout.isExpanded}
      note={noteSection}
      resources={resourcesSection}
    />
  );
  const stages = (
    <ApplicationStagesSection
      state={{
        data: stagesQuery.data,
        isLoading: stagesQuery.isLoading,
        error: stagesQuery.error,
        onRetry: stagesQuery.refetch,
      }}
    />
  );
  const signOut = async () => {
    try {
      await signOutMutation.mutateAsync();
      router.replace('/auth/login');
    } catch {
      showSnackbar({ variant: 'error', message: t('nav.logoutError') });
    }
  };
  const notifyPending = (_destination: 'resumes' | 'metrics' | 'profile') => {
    // TODO(CU-86ajvbvec): navigate to the complete CV Library.
    // TODO(CU-86ajvbvfm): navigate to the applications metrics dashboard.
    // TODO(CU-86ajvbvfq): navigate to the candidate profile.
    showSnackbar({ variant: 'info', message: t('nav.pending') });
  };

  return (
    <Screen edges={layout.isExpanded ? ['top', 'bottom'] : ['bottom']}>
      <View className="flex-1 flex-row">
        {layout.isExpanded ? (
          <ApplicationsDesktopNavigation
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
            onSignOut={() => void signOut()}
            signingOut={signOutMutation.isPending}
          />
        ) : null}
        <View className="flex-1">
          <ApplicationDetailHeader
            application={application}
            expanded={layout.isExpanded}
            backLabel={t('detail.back')}
            statusLabel={t(`status.${application.status}`)}
            changeStatusLabel={t('detail.changeStatus')}
            deleteLabel={t('actions.delete')}
            deleting={deleting}
            onBack={() => navigateToApplicationsHome(router)}
            onStatus={() => interactions.setStatusOpen(true)}
            onDelete={interactions.removeApplication}
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
                <View className="flex-1 gap-4">{summary}</View>
                <View className="flex-1 gap-4">
                  {stages}
                  <ApplicationDetailSummary
                    application={application}
                    includeNote
                    note={noteSection}
                    resources={null}
                    includeDetails={false}
                    includeResources={false}
                  />
                </View>
              </View>
            ) : tab === 'summary' ? (
              summary
            ) : (
              stages
            )}
          </ScrollView>
        </View>
      </View>
      <ApplicationDetailModals
        status={{
          visible: interactions.statusOpen,
          current: application.status,
          labels: applicationStatuses.map((status) => ({
            status,
            label: t(`status.${status}`),
          })),
          onClose: () => interactions.setStatusOpen(false),
          onSelect: interactions.selectStatus,
        }}
        resume={{
          visible: interactions.resumeOpen,
          resumes: resumes,
          selected: application.resume?.id ?? null,
          busy: resumePending,
          labels: {
            title: t('detail.chooseResume'),
            none: t('create.noResume'),
            upload: t('create.uploadResume'),
            cancel: t('actions.cancel'),
          },
          onClose: () => interactions.setResumeOpen(false),
          onSelect: (resumeId) => void interactions.selectResume(resumeId),
          onUpload: interactions.uploadResume,
        }}
        date={{
          visible: interactions.pendingStatus !== null,
          value: interactions.moveDate,
          labels: {
            title: t('create.date'),
            message: t('create.dateHelp'),
            date: t('create.date'),
            placeholder: t('create.datePlaceholder'),
            clear: t('actions.clear'),
            cancel: t('actions.cancel'),
            confirm: t('actions.confirm'),
            move: t('detail.changeStatus'),
          },
          onClose: () => interactions.setPendingStatus(null),
          onChange: interactions.setMoveDate,
          onConfirm: interactions.confirmStatusDate,
        }}
      />
    </Screen>
  );
}

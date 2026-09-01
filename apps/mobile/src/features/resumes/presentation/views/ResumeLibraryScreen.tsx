import { useRef } from 'react';
import { ScrollView, View, useWindowDimensions } from 'react-native';
import {
  AppText,
  BottomNavigation,
  Button,
  Notice,
  Screen,
} from '@palea/ui-native';
import { useLocale } from '@/core/localization/LocaleProvider';
import { PostAuthRouteGuard } from '@/features/auth/presentation/components/PostAuthRouteGuard';
import { ProductDesktopNavigation } from '@/common/presentation/components/ProductDesktopNavigation';
import { ResumeLibraryCollection } from '../components/ResumeLibraryCollection';
import {
  ResumeLibraryHeader,
  ResumePrivacyNote,
} from '../components/ResumeLibraryHeader';
import { ResumeLibraryDialogs } from '../components/ResumeLibraryDialogs';
import { ResumePdfPreview } from '../components/ResumePdfPreview';
import { useResumeLibraryInteractions } from '../viewmodels/useResumeLibraryInteractions';
import { useResumeLibraryPreferences } from '../stores/useResumeLibraryPreferences';

export function ResumeLibraryScreen() {
  return (
    <PostAuthRouteGuard>
      <ResumeLibraryContent />
    </PostAuthRouteGuard>
  );
}

function ResumeLibraryContent() {
  const { width } = useWindowDimensions();
  const expanded = width >= 1024;
  const ui = useResumeLibraryInteractions(expanded);
  const { vm } = ui;
  const { t } = useLocale('resumes');
  const { t: appT } = useLocale('applications');
  const view =
    useResumeLibraryPreferences((state) => state.view) ??
    (expanded ? 'grid' : 'list');
  const setView = useResumeLibraryPreferences((state) => state.setView);
  const scrollOffset = useRef(
    useResumeLibraryPreferences.getState().scrollOffset,
  );
  const policy = vm.policy.data;
  const supportLabel = policy
    ? t('supported', { size: policy.maxSizeBytes / 1024 / 1024 })
    : t('loadingPolicy');
  const uploadDisabled =
    vm.atLimit || !policy || vm.policy.isError || vm.upload.isPending;
  return (
    <Screen edges={expanded ? ['top', 'bottom'] : ['bottom']}>
      <View className="flex-1 flex-row">
        {expanded ? (
          <ProductDesktopNavigation
            active="resumes"
            collapseWhen={Boolean(ui.selected)}
            labels={{
              applications: appT('nav.applications'),
              metrics: appT('nav.metrics'),
              resumes: appT('nav.resumes'),
              profile: appT('nav.profile'),
              add: appT('add'),
              tracker: appT('sidebar.tracker'),
              logout: appT('nav.logout'),
            }}
            signingOut={ui.signingOut}
            onAdd={ui.addApplication}
            onPending={ui.navigate}
            onSignOut={() => void ui.signOut()}
          />
        ) : null}
        <View className="min-w-0 flex-1">
          <View
            className="h-14 flex-row items-center justify-between border-b border-border px-5 dark:border-dark-border"
            style={{ paddingHorizontal: expanded ? 28 : 20 }}
          >
            <AppText variant="label">
              {expanded ? t('collectionTitle') : 'Palea'}
            </AppText>
            {!expanded ? (
              <Button
                variant="ghost"
                size="sm"
                label={appT('nav.logout')}
                loading={ui.signingOut}
                onPress={() => void ui.signOut()}
              />
            ) : null}
          </View>
          <View className="min-h-0 flex-1 flex-row">
            <View className="min-w-0 flex-1">
              <ScrollView
                className="flex-1"
                contentContainerStyle={{ padding: expanded ? 28 : 20, gap: 20 }}
                contentOffset={{ x: 0, y: scrollOffset.current }}
                scrollEventThrottle={120}
                onScroll={(event) =>
                  useResumeLibraryPreferences
                    .getState()
                    .setScrollOffset(event.nativeEvent.contentOffset.y)
                }
              >
                <ResumeLibraryHeader
                  view={view}
                  count={vm.resumes.data?.length ?? 0}
                  onViewChange={setView}
                  onUpload={() => void ui.upload()}
                  uploadDisabled={uploadDisabled}
                  uploading={vm.upload.isPending}
                />
                {vm.upload.isPending ? (
                  <View
                    accessibilityLiveRegion="polite"
                    className="gap-2 rounded-md border border-border bg-surface p-4 dark:border-dark-border dark:bg-dark-surface"
                  >
                    <View className="flex-row justify-between">
                      <AppText variant="label">
                        {(vm.uploadProgress ?? 0) >= 95
                          ? t('processing')
                          : t('uploading')}
                      </AppText>
                      <AppText variant="caption" tone="muted">
                        {vm.uploadProgress ?? 0}%
                      </AppText>
                    </View>
                    <View
                      accessibilityRole="progressbar"
                      accessibilityValue={{
                        min: 0,
                        max: 100,
                        now: vm.uploadProgress ?? 0,
                      }}
                      accessibilityLabel={t('uploading')}
                      className="h-1 overflow-hidden rounded-full bg-surface-subtle dark:bg-dark-surface-subtle"
                    >
                      <View
                        className="h-full bg-interaction dark:bg-dark-interaction"
                        style={{ width: `${vm.uploadProgress ?? 0}%` }}
                      />
                    </View>
                  </View>
                ) : null}
                {vm.atLimit ? (
                  <Notice
                    title={t('limit', {
                      used: policy?.usedResumes,
                      max: policy?.maxResumes,
                      size: (policy?.maxSizeBytes ?? 0) / 1024 / 1024,
                    })}
                    message={t('limitReached')}
                    tone="warning"
                  />
                ) : null}
                {vm.policy.isError ? (
                  <View className="gap-2">
                    <AppText variant="bodySmall" tone="danger">
                      {t('policyError')}
                    </AppText>
                    <Button
                      variant="secondary"
                      label={t('retry')}
                      onPress={() => void vm.policy.refetch()}
                    />
                  </View>
                ) : null}
                <ResumeLibraryCollection
                  items={vm.resumes.data ?? []}
                  selectedId={ui.selected?.id ?? null}
                  view={view}
                  loading={vm.resumes.isLoading}
                  error={vm.resumes.isError}
                  onRetry={() => void vm.resumes.refetch()}
                  onOpen={ui.open}
                  onActions={ui.openMenu}
                  onDownload={(resume) => void ui.download(resume.id)}
                  onUpload={() => void ui.upload()}
                  uploadDisabled={uploadDisabled}
                  supportLabel={supportLabel}
                  busyId={
                    vm.setPrimary.isPending
                      ? vm.setPrimary.variables
                      : undefined
                  }
                />
                {policy ? (
                  <View className="gap-2">
                    <AppText variant="caption" tone="muted">
                      {t('limit', {
                        used: policy.usedResumes,
                        max: policy.maxResumes,
                        size: policy.maxSizeBytes / 1024 / 1024,
                      })}
                    </AppText>
                    <View className="h-1 overflow-hidden rounded-full bg-surface-subtle dark:bg-dark-surface-subtle">
                      <View
                        className="h-full bg-border-strong dark:bg-dark-border-strong"
                        style={{
                          width: `${Math.min(100, (policy.usedResumes / policy.maxResumes) * 100)}%`,
                        }}
                      />
                    </View>
                  </View>
                ) : null}
                <ResumePrivacyNote />
              </ScrollView>
            </View>
            {expanded && ui.selected ? (
              <View
                className="min-w-0 border-l border-border dark:border-dark-border"
                style={{ width: '50%' }}
              >
                <ResumePdfPreview
                  key={ui.selected.id}
                  title={ui.selected.displayName}
                  url={ui.preview.access.data?.signedUrl ?? null}
                  loading={ui.preview.access.isFetching}
                  error={ui.preview.access.isError}
                  onAccessError={ui.preview.recoverAccess}
                  onRetry={() => void ui.preview.access.refetch()}
                  onClose={ui.closeViewer}
                  onExpand={ui.expandViewer}
                  downloadPending={ui.preview.download.isPending}
                  onDownload={() => void ui.download(ui.selected!.id)}
                />
              </View>
            ) : null}
          </View>
          {!expanded ? (
            <BottomNavigation
              value="resumes"
              accessibilityLabel={t('navLabel')}
              onValueChange={ui.navigate}
              items={[
                {
                  value: 'applications',
                  label: appT('nav.applications'),
                  icon: 'briefcase',
                },
                {
                  value: 'resumes',
                  label: appT('nav.resumes'),
                  icon: 'fileText',
                },
              ]}
            />
          ) : null}
        </View>
      </View>
      <ResumeLibraryDialogs
        state={ui.dialog}
        resume={ui.dialogResume}
        pending={vm.rename.isPending || ui.remove.isPending}
        error={vm.rename.isError || ui.remove.isError}
        impact={ui.impact.data}
        impactLoading={ui.impact.isFetching}
        impactError={ui.impact.isError}
        impactChanged={ui.impactChanged}
        onDismiss={ui.closeDialog}
        onAction={(action) => void ui.action(action)}
        onRename={(name) => void ui.rename(name)}
        onDelete={() => ui.remove.mutate()}
        onRetryImpact={() => void ui.impact.refetch()}
      />
    </Screen>
  );
}

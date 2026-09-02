import { ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  AppText,
  Badge,
  Button,
  CollectionFeedback,
  FeedbackMessage,
  FormSection,
  Screen,
  Surface,
  TopAppBar,
  useResponsiveLayout,
  useSnackbar,
} from '@palea/ui-native';
import { useLocale } from '@/core/localization/LocaleProvider';
import { useSignOut } from '@/core/session/useSignOut';
import { PostAuthRouteGuard } from '@/features/auth/presentation/components/PostAuthRouteGuard';
import { ProductDesktopNavigation } from '@/common/presentation/components/ProductDesktopNavigation';
import { isPendingStageDue } from '../stages/applicationStageModel';
import { useApplicationStageViewModel } from '../stages/useApplicationStageViewModel';

export function ApplicationStageDetailScreen() {
  return (
    <PostAuthRouteGuard>
      <ApplicationStageDetailContent />
    </PostAuthRouteGuard>
  );
}

function ApplicationStageDetailContent() {
  const params = useLocalSearchParams<{
    applicationId: string;
    stageId: string;
  }>();
  const router = useRouter();
  const layout = useResponsiveLayout();
  const { t, i18n } = useLocale('applications');
  const signOut = useSignOut();
  const { showSnackbar } = useSnackbar();
  const vm = useApplicationStageViewModel(
    params.applicationId ?? '',
    params.stageId,
  );
  const stage = vm.detail.data;
  const edit = () =>
    router.push(
      `/applications/${params.applicationId}/stages/${params.stageId}/edit`,
    );
  if (!params.applicationId || !params.stageId || (vm.detail.error && !stage)) {
    return (
      <Screen>
        <CollectionFeedback
          status="error"
          title={t('stages.notFound')}
          message={t('error.load')}
          actionLabel={t('stages.back')}
          onAction={() =>
            router.replace(`/applications/${params.applicationId}`)
          }
        />
      </Screen>
    );
  }
  if (!stage || vm.detail.isLoading)
    return (
      <Screen>
        <CollectionFeedback status="loading" rows={5} />
      </Screen>
    );
  const date = stage.eventOn
    ? new Intl.DateTimeFormat(i18n.language, { dateStyle: 'long' }).format(
        new Date(`${stage.eventOn}T12:00:00`),
      )
    : t('stages.form.noDate');
  const overview = (
    <Surface padding="lg" className="gap-5">
      <View className="flex-row flex-wrap items-start justify-between gap-3">
        <View className="min-w-0 flex-1 gap-1">
          <AppText accessibilityRole="header" variant="screenTitle">
            {stage.name}
          </AppText>
          <AppText tone="muted">{date}</AppText>
        </View>
        <Badge
          label={t(`stages.result.${stage.result}`)}
          tone={
            stage.result === 'failed'
              ? 'danger'
              : stage.result === 'successful'
                ? 'success'
                : 'warning'
          }
        />
      </View>
      <View className="gap-1">
        <AppText variant="label" tone="muted">
          {t('stages.form.difficulty')}
        </AppText>
        <AppText>
          {stage.difficulty
            ? t(`stages.difficulty.${stage.difficulty}`)
            : t('detail.unspecified')}
        </AppText>
      </View>
    </Surface>
  );
  const notes = (
    <View className="gap-5">
      <StageText title={t('stages.form.questions')} value={stage.questions} />
      <StageText title={t('stages.form.comments')} value={stage.comments} />
    </View>
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
            onAdd={() => router.push('/applications/new')}
            onPending={(destination) => {
              if (destination === 'profile') {
                router.push('/profile' as never);
                return;
              }
              showSnackbar({ variant: 'info', message: t('nav.pending') });
            }}
            onSignOut={() => void signOut.mutateAsync()}
            signingOut={signOut.isPending}
          />
        ) : null}
        <View className="flex-1">
          <TopAppBar
            title={t('stages.detailTitle')}
            leading={
              <Button
                label="‹"
                accessibilityLabel={t('stages.back')}
                variant="ghost"
                size="sm"
                onPress={() =>
                  router.replace(`/applications/${params.applicationId}`)
                }
              />
            }
            trailing={
              <Button
                label={t('actions.edit')}
                variant="secondary"
                size="sm"
                onPress={edit}
              />
            }
            trailingClassName="items-end"
          />
          <ScrollView
            className="flex-1"
            contentContainerStyle={{
              alignSelf: 'center',
              gap: 24,
              maxWidth: layout.contentMaxWidth ?? 760,
              paddingHorizontal: layout.pageGutter,
              paddingVertical: layout.isExpanded ? 36 : 24,
              width: '100%',
            }}
          >
            {isPendingStageDue(stage) ? (
              <FeedbackMessage
                title={t('stages.warning.title')}
                message={t('stages.warning.message')}
                tone="warning"
                actionLabel={t('stages.warning.action')}
                onAction={edit}
              />
            ) : null}
            {layout.isExpanded ? (
              <View className="flex-row items-start gap-6">
                <View className="flex-[2]">{overview}</View>
                <View className="flex-1">
                  <FormSection
                    contained
                    title={t('stages.form.notes')}
                    leadingIcon="notes"
                  >
                    {notes}
                  </FormSection>
                </View>
              </View>
            ) : (
              <View className="gap-6">
                {overview}
                <FormSection title={t('stages.form.notes')} leadingIcon="notes">
                  {notes}
                </FormSection>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Screen>
  );
}

function StageText({ title, value }: { title: string; value: string | null }) {
  const { t } = useLocale('applications');
  return (
    <View className="gap-2">
      <AppText variant="bodySmall" className="font-semibold">
        {title}
      </AppText>
      <AppText tone={value ? 'default' : 'muted'}>
        {value ?? t('detail.unspecified')}
      </AppText>
    </View>
  );
}

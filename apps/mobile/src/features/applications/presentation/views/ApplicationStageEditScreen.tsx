import { useLocalSearchParams, useRouter } from 'expo-router';
import { CollectionFeedback, Screen } from '@palea/ui-native';
import { useLocale } from '@/core/localization/LocaleProvider';
import { PostAuthRouteGuard } from '@/features/auth/presentation/components/PostAuthRouteGuard';
import { ApplicationStageForm } from '../stages/ApplicationStageForm';
import {
  applicationStageFormFromStage,
  toUpdateStageInput,
} from '../stages/applicationStageModel';
import { useApplicationStageViewModel } from '../stages/useApplicationStageViewModel';

export function ApplicationStageEditScreen() {
  return (
    <PostAuthRouteGuard>
      <ApplicationStageEditContent />
    </PostAuthRouteGuard>
  );
}

function ApplicationStageEditContent() {
  const params = useLocalSearchParams<{
    applicationId: string;
    stageId: string;
  }>();
  const router = useRouter();
  const { t } = useLocale('applications');
  const vm = useApplicationStageViewModel(
    params.applicationId ?? '',
    params.stageId,
  );
  const stage = vm.detail.data;
  const back = () =>
    router.replace(
      `/applications/${params.applicationId}/stages/${params.stageId}`,
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
  return (
    <ApplicationStageForm
      mode="edit"
      initialValues={applicationStageFormFromStage(stage)}
      busy={vm.update.isPending || vm.remove.isPending}
      onBack={back}
      onSubmit={async (values) => {
        return vm.update.mutateAsync(
          toUpdateStageInput(params.applicationId, params.stageId, values),
        );
      }}
      onSaved={() => back()}
      onDelete={async () => {
        await vm.remove.mutateAsync(params.stageId);
      }}
      onDeleted={() => router.replace(`/applications/${params.applicationId}`)}
    />
  );
}

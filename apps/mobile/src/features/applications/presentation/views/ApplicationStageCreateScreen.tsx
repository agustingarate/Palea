import { useLocalSearchParams, useRouter } from 'expo-router';
import { PostAuthRouteGuard } from '@/features/auth/presentation/components/PostAuthRouteGuard';
import { ApplicationStageForm } from '../stages/ApplicationStageForm';
import {
  emptyApplicationStageForm,
  toCreateStageInput,
} from '../stages/applicationStageModel';
import { useApplicationStageViewModel } from '../stages/useApplicationStageViewModel';

export function ApplicationStageCreateScreen() {
  return (
    <PostAuthRouteGuard>
      <ApplicationStageCreateContent />
    </PostAuthRouteGuard>
  );
}

function ApplicationStageCreateContent() {
  const { applicationId } = useLocalSearchParams<{ applicationId: string }>();
  const router = useRouter();
  const vm = useApplicationStageViewModel(applicationId ?? '');
  const back = () => router.replace(`/applications/${applicationId}`);
  return (
    <ApplicationStageForm
      mode="create"
      initialValues={emptyApplicationStageForm}
      busy={vm.create.isPending}
      onBack={back}
      onSubmit={async (values) => {
        return vm.create.mutateAsync(
          toCreateStageInput(applicationId!, values),
        );
      }}
      onSaved={(stage) =>
        router.replace(`/applications/${applicationId}/stages/${stage.id}`)
      }
    />
  );
}

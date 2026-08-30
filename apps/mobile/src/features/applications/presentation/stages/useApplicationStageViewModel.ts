import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CreateApplicationStageInput,
  UpdateApplicationStageInput,
} from '../../domain/entities/Application';
import { useDependency } from '@/core/di/DependenciesProvider';
import { dependencyTokens } from '@/core/di/dependencies';

export const applicationStagesKey = (applicationId: string) =>
  ['applications', 'detail', applicationId, 'stages'] as const;
export const applicationStageKey = (applicationId: string, stageId: string) =>
  [...applicationStagesKey(applicationId), stageId] as const;

export function useApplicationStageViewModel(
  applicationId: string,
  stageId?: string,
) {
  const listStages = useDependency(dependencyTokens.listApplicationStages);
  const createStage = useDependency(dependencyTokens.createApplicationStage);
  const getStage = useDependency(dependencyTokens.getApplicationStage);
  const updateStage = useDependency(dependencyTokens.updateApplicationStage);
  const deleteStage = useDependency(dependencyTokens.deleteApplicationStage);
  const queryClient = useQueryClient();
  const list = useQuery({
    queryKey: applicationStagesKey(applicationId),
    queryFn: () => listStages.execute(applicationId),
    enabled: !!applicationId && !stageId,
  });
  const detail = useQuery({
    queryKey: applicationStageKey(applicationId, stageId ?? ''),
    queryFn: () => getStage.execute(applicationId, stageId!),
    enabled: !!applicationId && !!stageId,
  });
  const invalidateList = () =>
    queryClient.invalidateQueries({
      queryKey: applicationStagesKey(applicationId),
    });
  const create = useMutation({
    mutationFn: (input: CreateApplicationStageInput) =>
      createStage.execute(input),
    onSuccess: (stage) => {
      queryClient.setQueryData(
        applicationStageKey(applicationId, stage.id),
        stage,
      );
      void invalidateList();
    },
  });
  const update = useMutation({
    mutationFn: (input: UpdateApplicationStageInput) =>
      updateStage.execute(input),
    onSuccess: (stage) => {
      queryClient.setQueryData(
        applicationStageKey(applicationId, stage.id),
        stage,
      );
      void invalidateList();
    },
  });
  const remove = useMutation({
    mutationFn: (targetStageId: string) =>
      deleteStage.execute(applicationId, targetStageId),
    onSuccess: (_, targetStageId) => {
      queryClient.removeQueries({
        queryKey: applicationStageKey(applicationId, targetStageId),
      });
      void invalidateList();
    },
  });
  return { list, detail, create, update, remove };
}

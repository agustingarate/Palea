import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useDependency } from '@/core/di/DependenciesProvider';
import { dependencyTokens } from '@/core/di/dependencies';

const detailKey = (applicationId: string) =>
  ['applications', 'detail', applicationId] as const;

export function useApplicationEditViewModel(applicationId: string) {
  const getApplication = useDependency(dependencyTokens.getApplicationDetail);
  const updateApplication = useDependency(dependencyTokens.updateApplication);
  const queryClient = useQueryClient();
  const detail = useQuery({
    queryKey: detailKey(applicationId),
    queryFn: () => getApplication.execute(applicationId),
  });
  const update = useMutation({
    mutationFn: updateApplication.execute.bind(updateApplication),
    onSuccess: (application) => {
      queryClient.setQueryData(detailKey(applicationId), application);
      return queryClient.invalidateQueries({ queryKey: ['applications'] });
    },
  });
  return { detail, update };
}

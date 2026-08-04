import { useQuery } from '@tanstack/react-query';
import { dependencyTokens } from '@/core/di/dependencies';
import { useDependency } from '@/core/di/DependenciesProvider';

export function useProjectsViewModel() {
  const getProjects = useDependency(dependencyTokens.getProjects);
  const query = useQuery({
    queryKey: ['projects'],
    queryFn: ({ signal }) => getProjects.execute(signal),
  });
  return {
    projects: query.data ?? [],
    isLoading: query.isLoading,
    isRefreshing: query.isRefetching,
    error: query.error,
    refresh: query.refetch,
  };
}

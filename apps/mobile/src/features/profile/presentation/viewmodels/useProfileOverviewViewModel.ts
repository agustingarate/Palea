import { useQuery } from '@tanstack/react-query';
import { dependencyTokens } from '@/core/di/dependencies';
import { useDependency } from '@/core/di/DependenciesProvider';
import type { ProfileLocale } from '../../domain/entities/Profile';
import { profileQueryKeys } from './profileQueryKeys';

export function useProfileOverviewViewModel(locale: ProfileLocale) {
  const getProfileDetail = useDependency(dependencyTokens.getProfileDetail);
  const detail = useQuery({
    queryKey: profileQueryKeys.detail(locale),
    queryFn: ({ signal }) => getProfileDetail.execute(locale, signal),
  });

  return {
    profile: detail.data,
    isLoading: detail.isPending,
    isRefreshing: detail.isRefetching,
    error: detail.error,
    hasContent: detail.data !== undefined,
    refresh: detail.refetch,
  };
}

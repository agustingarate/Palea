import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useMemo } from 'react';
import { dependencyTokens } from '@/core/di/dependencies';
import { useDependency } from '@/core/di/DependenciesProvider';
import type {
  ProfileCatalogItem,
  ProfileLocale,
  UpdateProfileRoleInput,
} from '../../domain/entities/Profile';
import { profileQueryKeys } from './profileQueryKeys';

export function useProfileRoleViewModel(locale: ProfileLocale, search: string) {
  const getProfileDetail = useDependency(dependencyTokens.getProfileDetail);
  const listProfileInterests = useDependency(
    dependencyTokens.listProfileInterests,
  );
  const updateProfileRole = useDependency(dependencyTokens.updateProfileRole);
  const queryClient = useQueryClient();
  const normalizedSearch = search.trim();
  const detail = useQuery({
    queryKey: profileQueryKeys.detail(locale),
    queryFn: ({ signal }) => getProfileDetail.execute(locale, signal),
  });
  const interests = useInfiniteQuery({
    queryKey: profileQueryKeys.interests(locale, normalizedSearch),
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam, signal }) =>
      listProfileInterests.execute(
        {
          locale,
          ...(normalizedSearch ? { search: normalizedSearch } : {}),
          ...(pageParam ? { cursor: pageParam } : {}),
        },
        signal,
      ),
    getNextPageParam: (page) => page.nextCursor ?? undefined,
  });
  const mutation = useMutation({
    mutationFn: (input: UpdateProfileRoleInput) =>
      updateProfileRole.execute(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: profileQueryKeys.detail(locale),
      });
    },
  });
  const interestItems = useMemo(() => {
    const seen = new Set<string>();
    const items: ProfileCatalogItem[] = [];
    for (const page of interests.data?.pages ?? []) {
      for (const item of page.items) {
        if (!seen.has(item.id)) {
          seen.add(item.id);
          items.push(item);
        }
      }
    }
    return items;
  }, [interests.data]);

  return {
    profile: detail.data,
    profileError: detail.error,
    isProfileLoading: detail.isPending,
    refreshProfile: detail.refetch,
    interests: interestItems,
    interestError: interests.error,
    isInterestsLoading: interests.isPending,
    isFetchingMoreInterests: interests.isFetchingNextPage,
    hasMoreInterests: interests.hasNextPage,
    loadMoreInterests: interests.fetchNextPage,
    retryInterests: interests.refetch,
    updateRole: mutation,
  };
}

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useDependency } from '@/core/di/DependenciesProvider';
import { dependencyTokens } from '@/core/di/dependencies';
import type {
  ProfileExperienceInput,
  UpdateProfileExperienceInput,
} from '../../domain/entities/Profile';
import { profileQueryKeys } from '../viewmodels/profileQueryKeys';

export function useProfileExperiencesViewModel() {
  const listExperiences = useDependency(
    dependencyTokens.listProfileExperiences,
  );
  const query = useInfiniteQuery({
    queryKey: profileQueryKeys.experiences(),
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam, signal }) =>
      listExperiences.execute(pageParam ? { cursor: pageParam } : {}, signal),
    getNextPageParam: (page) => page.nextCursor ?? undefined,
  });
  return {
    items: query.data?.pages.flatMap((page) => page.items) ?? [],
    isLoading: query.isPending,
    isInitialError: query.isError && !query.data,
    isIncrementalError: query.isError && Boolean(query.data),
    isFetchingMore: query.isFetchingNextPage,
    hasMore: Boolean(query.hasNextPage),
    retry: query.refetch,
    loadMore: query.fetchNextPage,
  };
}

export function useProfileExperienceFormViewModel(experienceId?: string) {
  const getExperience = useDependency(dependencyTokens.getProfileExperience);
  const createExperience = useDependency(
    dependencyTokens.createProfileExperience,
  );
  const updateExperience = useDependency(
    dependencyTokens.updateProfileExperience,
  );
  const deleteExperience = useDependency(
    dependencyTokens.deleteProfileExperience,
  );
  const queryClient = useQueryClient();
  const experience = useQuery({
    queryKey: profileQueryKeys.experience(experienceId ?? 'new'),
    queryFn: ({ signal }) => getExperience.execute(experienceId!, signal),
    enabled: Boolean(experienceId),
  });
  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: profileQueryKeys.experiences(),
      }),
      queryClient.invalidateQueries({ queryKey: profileQueryKeys.all }),
    ]);
  };
  const save = useMutation({
    mutationFn: (
      input: ProfileExperienceInput | UpdateProfileExperienceInput,
    ) =>
      experienceId
        ? updateExperience.execute(input as UpdateProfileExperienceInput)
        : createExperience.execute(input),
    onSuccess: refresh,
  });
  const remove = useMutation({
    mutationFn: () => deleteExperience.execute(experienceId!),
    onSuccess: refresh,
  });
  return {
    experience: experience.data,
    isLoading: Boolean(experienceId) && experience.isPending,
    error: experience.error,
    retry: experience.refetch,
    save,
    remove,
  };
}

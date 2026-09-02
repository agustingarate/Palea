import { useEffect, useMemo, useRef, useState } from 'react';
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useDependency } from '@/core/di/DependenciesProvider';
import { dependencyTokens } from '@/core/di/dependencies';
import type {
  ProfileCatalogItem,
  ProfileLocale,
} from '../../domain/entities/Profile';
import { profileQueryKeys } from '../viewmodels/profileQueryKeys';
import { sameIds } from './profileSelection';

export function useProfileSkillsViewModel(locale: ProfileLocale) {
  const getProfileDetail = useDependency(dependencyTokens.getProfileDetail);
  const listProfileSkills = useDependency(dependencyTokens.listProfileSkills);
  const replaceProfileSkills = useDependency(
    dependencyTokens.replaceProfileSkills,
  );
  const queryClient = useQueryClient();
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<ProfileCatalogItem[]>([]);
  const initializedLocale = useRef<ProfileLocale | null>(null);
  useEffect(() => {
    const timeout = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(timeout);
  }, [searchInput]);
  const detail = useQuery({
    queryKey: profileQueryKeys.detail(locale),
    queryFn: ({ signal }) => getProfileDetail.execute(locale, signal),
  });
  useEffect(() => {
    if (!detail.data || initializedLocale.current === locale) return;
    initializedLocale.current = locale;
    setSelected([...detail.data.skills]);
  }, [detail.data, locale]);
  const catalog = useInfiniteQuery({
    queryKey: profileQueryKeys.skills(locale, search),
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam, signal }) =>
      listProfileSkills.execute(
        {
          locale,
          ...(search ? { search } : {}),
          ...(pageParam ? { cursor: pageParam } : {}),
        },
        signal,
      ),
    getNextPageParam: (page) => page.nextCursor ?? undefined,
  });
  const items = useMemo(() => {
    const values = new Map<string, ProfileCatalogItem>();
    for (const page of catalog.data?.pages ?? [])
      for (const item of page.items) values.set(item.id, item);
    return [...values.values()];
  }, [catalog.data]);
  const save = useMutation({
    mutationFn: () =>
      replaceProfileSkills.execute({ skillIds: selected.map(({ id }) => id) }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: profileQueryKeys.all });
    },
  });
  const toggle = (item: ProfileCatalogItem) => {
    setSelected((current) => {
      if (current.some(({ id }) => id === item.id))
        return current.filter(({ id }) => id !== item.id);
      return current.length < 10 ? [...current, item] : current;
    });
  };
  const initialSkillIds = detail.data?.skills.map(({ id }) => id) ?? [];
  const isDirty = !sameIds(
    selected.map(({ id }) => id),
    initialSkillIds,
  );
  return {
    detail,
    searchInput,
    setSearchInput,
    selected,
    isDirty,
    items,
    toggle,
    save,
    isCatalogLoading: catalog.isPending,
    isInitialCatalogError: catalog.isError && !catalog.data,
    isIncrementalCatalogError: catalog.isError && Boolean(catalog.data),
    retryCatalog: catalog.refetch,
    loadMore: catalog.fetchNextPage,
    hasMore: Boolean(catalog.hasNextPage),
    isFetchingMore: catalog.isFetchingNextPage,
  };
}

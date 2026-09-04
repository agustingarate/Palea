import {
  type InfiniteData,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';
import { useDependency } from '@/core/di/DependenciesProvider';
import { dependencyTokens } from '@/core/di/dependencies';
import type {
  Application,
  ApplicationPage,
  ApplicationStatus,
} from '../../domain/entities/Application';
import type { ListApplications } from '../../domain/usecases/ListApplications';
import { useDebouncedValue } from '../hooks/useDebouncedValue';

export const applicationStatuses: ApplicationStatus[] = [
  'draft',
  'applied',
  'interview',
  'offer',
  'rejected',
];

type ApplicationsPage = {
  items: Application[];
  nextCursor: string | null;
  total: number;
};
type InfiniteApplicationsData = InfiniteData<ApplicationPage>;
export type ApplicationCollection = ApplicationsPage & {
  isLoading: boolean;
  isError: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  loadMore: () => Promise<unknown>;
  retry: () => Promise<unknown>;
};

const applicationsQueryKey = (status: ApplicationStatus, search: string) =>
  ['applications', status, search] as const;

function combinePages(data: InfiniteApplicationsData | undefined) {
  const pages = data?.pages ?? [];
  return {
    items: pages.flatMap((page) => page.items),
    nextCursor: pages.at(-1)?.nextCursor ?? null,
    total: pages[0]?.total ?? 0,
  } satisfies ApplicationsPage;
}

function useApplicationStatusQuery(
  status: ApplicationStatus,
  search: string,
  listApplications: ListApplications,
) {
  return useInfiniteQuery({
    queryKey: applicationsQueryKey(status, search),
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) =>
      listApplications.execute(status, {
        search: search || undefined,
        cursor: pageParam,
      }),
    getNextPageParam: (page) => page.nextCursor ?? undefined,
  });
}

export function useApplicationsViewModel() {
  const listApplications = useDependency(dependencyTokens.listApplications);
  const updateApplicationStatus = useDependency(
    dependencyTokens.updateApplicationStatus,
  );
  const deleteApplication = useDependency(dependencyTokens.deleteApplication);
  const queryClient = useQueryClient();
  const [searchInput, setSearchInput] = useState('');
  const search = useDebouncedValue(searchInput, 300);

  const draftQuery = useApplicationStatusQuery(
    'draft',
    search,
    listApplications,
  );
  const appliedQuery = useApplicationStatusQuery(
    'applied',
    search,
    listApplications,
  );
  const interviewQuery = useApplicationStatusQuery(
    'interview',
    search,
    listApplications,
  );
  const offerQuery = useApplicationStatusQuery(
    'offer',
    search,
    listApplications,
  );
  const rejectedQuery = useApplicationStatusQuery(
    'rejected',
    search,
    listApplications,
  );
  const queries = [
    draftQuery,
    appliedQuery,
    interviewQuery,
    offerQuery,
    rejectedQuery,
  ];
  const pages = useMemo(
    () =>
      Object.fromEntries(
        applicationStatuses.map((status, index) => [
          status,
          combinePages(queries[index]!.data),
        ]),
      ) as Record<ApplicationStatus, ApplicationsPage>,
    [queries],
  );
  const collections = useMemo(
    () =>
      Object.fromEntries(
        applicationStatuses.map((status, index) => {
          const query = queries[index]!;
          return [
            status,
            {
              ...pages[status],
              isLoading: query.isLoading,
              isError: query.isError,
              hasNextPage: Boolean(query.hasNextPage),
              isFetchingNextPage: query.isFetchingNextPage,
              loadMore: () =>
                query.isFetchingNextPage
                  ? Promise.resolve()
                  : query.fetchNextPage(),
              retry: () => query.refetch(),
            },
          ];
        }),
      ) as Record<ApplicationStatus, ApplicationCollection>,
    [pages, queries],
  );

  const moveMutation = useMutation({
    mutationFn: ({
      applicationId,
      status,
      targetIndex,
      appliedOn,
    }: {
      applicationId: string;
      status: ApplicationStatus;
      targetIndex: number;
      appliedOn?: string;
    }) =>
      updateApplicationStatus.execute(
        applicationId,
        status,
        targetIndex,
        appliedOn,
        Intl.DateTimeFormat().resolvedOptions().timeZone,
      ),
  });
  const deleteMutation = useMutation({
    mutationFn: (applicationId: string) =>
      deleteApplication.execute(applicationId),
  });

  const refresh = useCallback(
    async () =>
      Promise.all(
        applicationStatuses.map((status) =>
          queryClient.invalidateQueries({
            queryKey: applicationsQueryKey(status, search),
          }),
        ),
      ),
    [queryClient, search],
  );

  const ensureApplicationVisible = useCallback(
    async (applicationId: string, status: ApplicationStatus) => {
      const key = applicationsQueryKey(status, search);
      const query = queries[applicationStatuses.indexOf(status)]!;
      while (true) {
        const data = queryClient.getQueryData<InfiniteApplicationsData>(key);
        if (combinePages(data).items.some((item) => item.id === applicationId))
          return;
        if (!data?.pages.at(-1)?.nextCursor) return;
        const pageCount = data.pages.length;
        const result = await query.fetchNextPage();
        if (result.isError || result.data?.pages.length === pageCount) return;
      }
    },
    [queries, queryClient, search],
  );

  const move = useCallback(
    async (
      application: Application,
      status: ApplicationStatus,
      targetIndex?: number,
      appliedOn?: string,
    ) => {
      const source = pages[application.status].items;
      const destination = pages[status].items.filter(
        (item) => item.id !== application.id,
      );
      const insertionIndex = Math.min(
        targetIndex ?? destination.length,
        destination.length,
      );
      const sourceIndex = source.findIndex(
        (item) => item.id === application.id,
      );
      if (application.status === status && sourceIndex === insertionIndex)
        return false;

      const snapshots = applicationStatuses.map(
        (candidate) =>
          [
            candidate,
            queryClient.getQueryData(applicationsQueryKey(candidate, search)),
          ] as const,
      );
      const patch = (
        candidate: ApplicationStatus,
        updater: (items: Application[]) => Application[],
      ) => {
        queryClient.setQueryData<InfiniteApplicationsData>(
          applicationsQueryKey(candidate, search),
          (data) => {
            if (!data) return data;
            const items = updater(
              data.pages.flatMap((page: ApplicationPage) => page.items),
            );
            const pageSizes = data.pages.map(
              (page: ApplicationPage) => page.items.length,
            );
            if (candidate === status && candidate !== application.status) {
              const lastIndex = pageSizes.length - 1;
              pageSizes[lastIndex] = (pageSizes[lastIndex] ?? 0) + 1;
            }
            let offset = 0;
            return {
              ...data,
              pages: data.pages.map((page: ApplicationPage, index: number) => {
                const pageSize = pageSizes[index] ?? 0;
                const pageItems = items.slice(offset, offset + pageSize);
                offset += pageSize;
                return {
                  ...page,
                  items: pageItems,
                  total:
                    candidate === application.status && candidate !== status
                      ? Math.max(0, page.total - 1)
                      : candidate === status && candidate !== application.status
                        ? page.total + 1
                        : page.total,
                };
              }),
            };
          },
        );
      };
      patch(application.status, (items) =>
        items.filter((item) => item.id !== application.id),
      );
      patch(status, (items) => {
        const next = items.filter((item) => item.id !== application.id);
        next.splice(insertionIndex, 0, {
          ...application,
          status,
          appliedOn: application.appliedOn ?? appliedOn ?? null,
        });
        return next.map((item, position) => ({ ...item, position }));
      });
      try {
        await moveMutation.mutateAsync({
          applicationId: application.id,
          status,
          targetIndex: insertionIndex,
          appliedOn,
        });
        await refresh().catch(() => undefined);
        await ensureApplicationVisible(application.id, status).catch(
          () => undefined,
        );
        return true;
      } catch (error) {
        snapshots.forEach(([candidate, data]) =>
          queryClient.setQueryData(
            applicationsQueryKey(candidate, search),
            data,
          ),
        );
        throw error;
      }
    },
    [
      ensureApplicationVisible,
      moveMutation,
      pages,
      queryClient,
      refresh,
      search,
    ],
  );

  const loadMoreBoardColumns = useCallback(
    async () =>
      Promise.all(
        applicationStatuses.map((status) => {
          const collection = collections[status];
          return collection.hasNextPage && !collection.isFetchingNextPage
            ? collection.loadMore()
            : undefined;
        }),
      ),
    [collections],
  );

  const remove = useCallback(
    async (application: Application) => {
      const key = applicationsQueryKey(application.status, search);
      const snapshot = queryClient.getQueryData(key);
      queryClient.setQueryData<InfiniteApplicationsData>(key, (data) => {
        if (!data) return data;
        return {
          ...data,
          pages: data.pages.map((page: ApplicationPage) => ({
            ...page,
            items: page.items.filter((item) => item.id !== application.id),
            total: Math.max(0, page.total - 1),
          })),
        };
      });
      try {
        await deleteMutation.mutateAsync(application.id);
      } catch (error) {
        queryClient.setQueryData(key, snapshot);
        throw error;
      } finally {
        void refresh();
      }
    },
    [deleteMutation, queryClient, refresh, search],
  );

  return {
    pages,
    collections,
    searchInput,
    setSearchInput,
    refresh,
    loadMoreBoardColumns,
    move,
    remove,
    removePending: deleteMutation.isPending,
  };
}

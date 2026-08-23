import {
  Alert,
  ScrollView,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useEffect, useState } from 'react';
import { Redirect, useRouter } from 'expo-router';
import {
  AppText,
  BottomNavigation,
  Button,
  Screen,
  SegmentedControl,
  TopAppBar,
  useResponsiveLayout,
  useSnackbar,
} from '@palea/ui-native';
import type {
  Application,
  ApplicationStatus,
} from '../../domain/entities/Application';
import { useLocale } from '@/core/localization/LocaleProvider';
import { useDependency } from '@/core/di/DependenciesProvider';
import { dependencyTokens } from '@/core/di/dependencies';
import { useAuthSession } from '@/features/auth/presentation/providers/AuthProvider';
import { resolvePostAuthRoute } from '@/features/auth/presentation/navigation/resolvePostAuthRoute';
import { ApplicationActionMenu } from '../components/ApplicationActionMenu';
import { BoardColumn, ListGroup } from '../components/ApplicationsCollections';
import { ApplicationsDesktopNavigation } from '../components/ApplicationsNavigation';
import { useApplicationsDragAndDrop } from '../hooks/useApplicationsDragAndDrop';
import {
  applicationStatuses,
  useApplicationsViewModel,
} from '../viewmodels/useApplicationsViewModel';

export function ApplicationsHomeScreen() {
  const { session, isRestoring } = useAuthSession();
  if (isRestoring) return null;
  if (!session) return <Redirect href="/auth/login" />;
  return <AuthenticatedApplicationsHome key={session.userId} />;
}

function AuthenticatedApplicationsHome() {
  const onboarding = useDependency(dependencyTokens.onboardingRepository);
  const router = useRouter();
  const [isResolvingRoute, setResolvingRoute] = useState(true);

  useEffect(() => {
    let active = true;
    void onboarding
      .getAccount()
      .then((account) => {
        if (!active) return;
        const destination = resolvePostAuthRoute(account);
        if (destination !== '/') router.replace(destination);
        else setResolvingRoute(false);
      })
      .catch(() => {
        if (active) setResolvingRoute(false);
      });
    return () => {
      active = false;
    };
  }, [onboarding, router]);

  if (isResolvingRoute) return null;
  return <ApplicationsHomeContent />;
}

function ApplicationsHomeContent() {
  const vm = useApplicationsViewModel();
  const { t, i18n } = useLocale('applications');
  const layout = useResponsiveLayout();
  const { showSnackbar } = useSnackbar();
  const router = useRouter();
  const auth = useDependency(dependencyTokens.authRepository);
  const { height: viewportHeight } = useWindowDimensions();
  const [view, setView] = useState<'board' | 'list'>('board');
  const [expanded, setExpanded] = useState<Record<ApplicationStatus, boolean>>(
    () =>
      Object.fromEntries(
        applicationStatuses.map((status) => [status, true]),
      ) as Record<ApplicationStatus, boolean>,
  );
  const [actionFor, setActionFor] = useState<{
    application: Application;
    anchor: { x: number; y: number };
  } | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [isSigningOut, setSigningOut] = useState(false);
  const expandStatus = (status: ApplicationStatus) =>
    setExpanded((current) =>
      current[status] ? current : { ...current, [status]: true },
    );
  const move = async (
    application: Application,
    status: ApplicationStatus,
    targetIndex?: number,
  ) => {
    try {
      const changed = await vm.move(application, status, targetIndex);
      if (changed)
        showSnackbar({ variant: 'success', message: t('feedback.moved') });
    } catch {
      showSnackbar({ variant: 'error', message: t('error.move') });
    }
  };
  const dragAndDrop = useApplicationsDragAndDrop({
    pages: vm.pages,
    viewportHeight,
    onMove: move,
    onExpand: expandStatus,
  });
  const isBoard = layout.isExpanded && view === 'board';
  const remove = (application: Application) =>
    Alert.alert(t('delete.title'), t('delete.message'), [
      { text: t('delete.cancel'), style: 'cancel' },
      {
        text: t('delete.confirm'),
        style: 'destructive',
        onPress: () =>
          void vm
            .remove(application)
            .then(() =>
              showSnackbar({
                variant: 'success',
                message: t('feedback.deleted'),
              }),
            )
            .catch(() =>
              showSnackbar({ variant: 'error', message: t('error.delete') }),
            ),
      },
    ]);
  const signOut = async () => {
    setSigningOut(true);
    try {
      await auth.signOut();
      router.replace('/auth/login');
    } catch {
      showSnackbar({ variant: 'error', message: t('nav.logoutError') });
    } finally {
      setSigningOut(false);
    }
  };
  const notifyPending = () =>
    showSnackbar({ variant: 'info', message: t('nav.pending') });
  const notifyAddPending = () =>
    showSnackbar({ variant: 'info', message: t('add.pending') });

  return (
    <Screen edges={layout.isExpanded ? ['top', 'bottom'] : ['bottom']}>
      <View className="flex-1 flex-row">
        {layout.isExpanded ? (
          <ApplicationsDesktopNavigation
            labels={{
              applications: t('nav.applications'),
              metrics: t('nav.metrics'),
              resumes: t('nav.resumes'),
              profile: t('nav.profile'),
              add: t('add'),
              tracker: t('sidebar.tracker'),
              logout: t('nav.logout'),
            }}
            onAdd={notifyAddPending}
            onPending={notifyPending}
            onSignOut={() => void signOut()}
            signingOut={isSigningOut}
          />
        ) : null}
        <View className="flex-1">
          {!layout.isExpanded ? (
            <TopAppBar
              title="Palea"
              trailing={
                <View className="flex-row items-center">
                  <Button
                    label="⌕"
                    accessibilityLabel={t('search.label')}
                    variant="ghost"
                    onPress={() => setSearchOpen((open) => !open)}
                  />
                  <Button
                    label={t('nav.logout')}
                    accessibilityLabel={t('nav.logout')}
                    variant="ghost"
                    size="sm"
                    loading={isSigningOut}
                    onPress={() => void signOut()}
                  />
                </View>
              }
            />
          ) : null}
          <ApplicationsHeader
            expanded={layout.isExpanded}
            contentMaxWidth={layout.contentMaxWidth ?? 1200}
            title={t('title')}
            subtitle={t('subtitle')}
            searchLabel={t('search.label')}
            searchPlaceholder={t('search.placeholder')}
            searchValue={vm.searchInput}
            onSearchChange={vm.setSearchInput}
            searchOpen={searchOpen}
            view={view}
            onViewChange={setView}
            boardLabel={t('view.board')}
            listLabel={t('view.list')}
            viewLabel={t('view.label')}
            addLabel={t('add')}
            onAdd={notifyAddPending}
          />
          <View className="flex-1">
            {isBoard ? (
              <ScrollView
                className="flex-1"
                ref={dragAndDrop.boardRef}
                contentContainerClassName="flex-grow px-4 py-5"
                scrollEventThrottle={16}
                onScroll={(event) => {
                  const { contentOffset, contentSize, layoutMeasurement } =
                    event.nativeEvent;
                  dragAndDrop.onBoardScroll(contentOffset.y);
                  if (
                    contentOffset.y + layoutMeasurement.height >=
                    contentSize.height - 160
                  )
                    void vm.loadMoreBoardColumns();
                }}
              >
                <ScrollView
                  horizontal
                  className="flex-1"
                  contentContainerClassName="flex-grow"
                  showsHorizontalScrollIndicator
                >
                  <View className="flex-row gap-4">
                    {applicationStatuses.map((status) => (
                      <BoardColumn
                        key={status}
                        status={status}
                        title={t(`status.${status}`)}
                        items={vm.pages[status].items}
                        total={vm.collections[status].total}
                        loading={vm.collections[status].isLoading}
                        error={vm.collections[status].isError}
                        onRetry={() => void vm.collections[status].retry()}
                        errorTitle={t('error.title')}
                        errorMessage={t('error.load')}
                        retryLabel={t('error.retry')}
                        more={vm.collections[status].hasNextPage}
                        onMore={() => void vm.collections[status].loadMore()}
                        loadMoreLabel={t('list.loadMore')}
                        onAction={(application, anchor) =>
                          setActionFor({ application, anchor })
                        }
                        onDrop={dragAndDrop.onBoardDrop}
                        onDragMove={dragAndDrop.onBoardDragMove}
                        onDrag={dragAndDrop.onDrag}
                        isDragSource={Boolean(
                          dragAndDrop.dragging &&
                          vm.pages[status].items.some(
                            (item) => item.id === dragAndDrop.dragging?.id,
                          ),
                        )}
                        draggingId={dragAndDrop.dragging?.id}
                        highlighted={dragAndDrop.hoveredStatus === status}
                        emptyTitle={t('board.emptyTitle')}
                        emptyDescription={t(`board.emptyDescription.${status}`)}
                        dropIndex={
                          dragAndDrop.dropPreview?.status === status
                            ? dragAndDrop.dropPreview.index
                            : null
                        }
                        onAdd={notifyAddPending}
                        addLabel={t('add')}
                        dateLocale={i18n.language}
                        workModeLabel={(workMode) => t(`workMode.${workMode}`)}
                        actionsLabel={t('actions.label')}
                        onLayout={(x, y, width, height) =>
                          dragAndDrop.onBoardLayout(status, x, y, width, height)
                        }
                        onCardLayout={(id, y, height) =>
                          dragAndDrop.onCardLayout(status, id, y, height)
                        }
                      />
                    ))}
                  </View>
                </ScrollView>
              </ScrollView>
            ) : (
              <ScrollView
                className="flex-1"
                ref={dragAndDrop.listRef}
                contentContainerClassName="gap-3 px-4 py-5 pb-28"
                scrollEventThrottle={16}
                onScroll={(event) =>
                  dragAndDrop.onListScroll(event.nativeEvent.contentOffset.y)
                }
              >
                {applicationStatuses.map((status) => (
                  <ListGroup
                    key={status}
                    status={status}
                    title={t(`status.${status}`)}
                    expanded={expanded[status]}
                    total={vm.pages[status].total}
                    items={vm.pages[status].items}
                    loading={vm.collections[status].isLoading}
                    error={vm.collections[status].isError}
                    onRetry={() => void vm.collections[status].retry()}
                    errorTitle={t('error.title')}
                    errorMessage={t('error.load')}
                    retryLabel={t('error.retry')}
                    dragging={dragAndDrop.dragging}
                    highlighted={dragAndDrop.hoveredStatus === status}
                    dropIndex={
                      dragAndDrop.dropPreview?.status === status
                        ? dragAndDrop.dropPreview.index
                        : null
                    }
                    onToggle={() =>
                      setExpanded((current) => ({
                        ...current,
                        [status]: !current[status],
                      }))
                    }
                    onDrag={dragAndDrop.onDrag}
                    onDragMove={dragAndDrop.onListDragMove}
                    onDrop={dragAndDrop.onListDrop}
                    onLayout={(y, height) =>
                      dragAndDrop.onListLayout(status, y, height)
                    }
                    onCardLayout={(id, y, height) =>
                      dragAndDrop.onCardLayout(status, id, y, height)
                    }
                    layoutVersion={dragAndDrop.listScrollOffset}
                    onAction={(application, anchor) =>
                      setActionFor({ application, anchor })
                    }
                    onMore={() => void vm.collections[status].loadMore()}
                    more={vm.collections[status].hasNextPage}
                    loadMoreLabel={t('list.loadMore')}
                    addLabel={t('add')}
                    onAdd={notifyAddPending}
                    workModeLabel={(workMode) => t(`workMode.${workMode}`)}
                    actionsLabel={t('actions.label')}
                    dateLocale={i18n.language}
                  />
                ))}
              </ScrollView>
            )}
          </View>
          {!layout.isExpanded ? (
            <BottomNavigation
              value="applications"
              onValueChange={notifyPending}
              items={[
                {
                  value: 'applications',
                  label: t('nav.applications'),
                  icon: 'briefcase',
                },
                { value: 'metrics', label: t('nav.metrics'), icon: 'barChart' },
                { value: 'resumes', label: t('nav.resumes'), icon: 'fileText' },
                { value: 'profile', label: t('nav.profile'), icon: 'user' },
              ]}
            />
          ) : null}
          {!layout.isExpanded ? (
            <View className="absolute bottom-20 right-5">
              <Button
                label="+"
                accessibilityLabel={t('add')}
                onPress={notifyAddPending}
              />
            </View>
          ) : null}
          {actionFor ? (
            <ApplicationActionMenu
              anchor={actionFor.anchor}
              labels={{
                edit: t('actions.edit'),
                remove: t('actions.delete'),
                cancel: t('actions.cancel'),
              }}
              onDismiss={() => setActionFor(null)}
              onDelete={() => {
                setActionFor(null);
                remove(actionFor.application);
              }}
            />
          ) : null}
        </View>
      </View>
    </Screen>
  );
}

function ApplicationsHeader({
  expanded,
  contentMaxWidth,
  title,
  subtitle,
  searchLabel,
  searchPlaceholder,
  searchValue,
  onSearchChange,
  searchOpen,
  view,
  onViewChange,
  boardLabel,
  listLabel,
  viewLabel,
  addLabel,
  onAdd,
}: {
  expanded: boolean;
  contentMaxWidth: number;
  title: string;
  subtitle: string;
  searchLabel: string;
  searchPlaceholder: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchOpen: boolean;
  view: 'board' | 'list';
  onViewChange: (view: 'board' | 'list') => void;
  boardLabel: string;
  listLabel: string;
  viewLabel: string;
  addLabel: string;
  onAdd: () => void;
}) {
  return (
    <View className="border-b border-border bg-surface px-4 py-3 dark:border-dark-border dark:bg-dark-surface">
      <View
        className="w-full gap-3 self-center"
        style={{ maxWidth: contentMaxWidth }}
      >
        <View className="flex-row items-center justify-between gap-4">
          <View className="flex-1">
            <AppText variant="screenTitle">{title}</AppText>
            {expanded ? (
              <AppText variant="bodySmall" tone="muted">
                {subtitle}
              </AppText>
            ) : null}
          </View>
          {!expanded ? (
            <Button
              label="+"
              accessibilityLabel={addLabel}
              variant="ghost"
              onPress={onAdd}
            />
          ) : (
            <View className="flex-row items-center gap-3">
              <TextInput
                accessibilityLabel={searchLabel}
                className="min-h-control-md w-72 rounded-md border border-border bg-background px-3 text-sm dark:border-dark-border dark:bg-dark-background"
                placeholder={searchPlaceholder}
                value={searchValue}
                onChangeText={onSearchChange}
              />
              <SegmentedControl
                value={view}
                label={viewLabel}
                compact
                onValueChange={(next) => onViewChange(next as 'board' | 'list')}
                items={[
                  { value: 'board', label: boardLabel, icon: 'grid' },
                  { value: 'list', label: listLabel, icon: 'list' },
                ]}
              />
            </View>
          )}
        </View>
        {!expanded && searchOpen ? (
          <TextInput
            accessibilityLabel={searchLabel}
            className="min-h-control-lg rounded-md border border-border bg-background px-3 dark:border-dark-border dark:bg-dark-background"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChangeText={onSearchChange}
          />
        ) : null}
      </View>
    </View>
  );
}

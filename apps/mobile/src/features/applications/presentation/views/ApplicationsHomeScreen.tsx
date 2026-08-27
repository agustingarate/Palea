import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import {
  AppText,
  BottomNavigation,
  Button,
  DatePickerField,
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
import { PostAuthRouteGuard } from '@/features/auth/presentation/components/PostAuthRouteGuard';
import { ApplicationActionMenu } from '../components/ApplicationActionMenu';
import { BoardColumn, ListGroup } from '../components/ApplicationsCollections';
import { ApplicationsDesktopNavigation } from '../components/ApplicationsNavigation';
import { useApplicationsDragAndDrop } from '../hooks/useApplicationsDragAndDrop';
import {
  applicationStatuses,
  useApplicationsViewModel,
} from '../viewmodels/useApplicationsViewModel';
import { todayLocal } from '../create/applicationCreateModel';

export function ApplicationsHomeScreen() {
  return (
    <PostAuthRouteGuard>
      <ApplicationsHomeContent />
    </PostAuthRouteGuard>
  );
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
  const [pendingMove, setPendingMove] = useState<{
    application: Application;
    status: ApplicationStatus;
    targetIndex?: number;
  } | null>(null);
  const [moveDate, setMoveDate] = useState<string | null>(todayLocal());
  const expandStatus = (status: ApplicationStatus) =>
    setExpanded((current) =>
      current[status] ? current : { ...current, [status]: true },
    );
  const move = async (
    application: Application,
    status: ApplicationStatus,
    targetIndex?: number,
  ) => {
    if (
      application.status === 'draft' &&
      status !== 'draft' &&
      !application.appliedOn
    ) {
      setMoveDate(todayLocal());
      setPendingMove({ application, status, targetIndex });
      return;
    }
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
  const notifyPending = (destination: string) => {
    if (destination === 'applications') return;
    // TODO(CU-86ajvbvec): navigate to the complete CV Library.
    // TODO(CU-86ajvbvfm): navigate to the applications metrics dashboard.
    // TODO(CU-86ajvbvfq): navigate to the candidate profile.
    showSnackbar({ variant: 'info', message: t('nav.pending') });
  };
  const addApplication = () => router.push('/applications/new');

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
            onAdd={addApplication}
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
            onAdd={addApplication}
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
                        onAdd={addApplication}
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
                    onAdd={addApplication}
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
                onPress={addApplication}
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
          <Modal
            transparent
            animationType="fade"
            visible={Boolean(pendingMove)}
            onRequestClose={() => setPendingMove(null)}
          >
            <Pressable
              className="flex-1 items-center justify-center bg-overlay px-6"
              onPress={() => setPendingMove(null)}
            >
              <Pressable
                accessibilityViewIsModal
                className="w-full max-w-md gap-5 rounded-lg bg-surface p-5 dark:bg-dark-surface"
                onPress={() => undefined}
              >
                <View className="gap-1">
                  <AppText variant="sectionTitle">
                    {t('moveDate.title')}
                  </AppText>
                  <AppText tone="muted">{t('moveDate.message')}</AppText>
                </View>
                <DatePickerField
                  label={t('create.date')}
                  value={moveDate}
                  maximum={todayLocal()}
                  placeholder={t('create.datePlaceholder')}
                  clearLabel={t('create.clearDate')}
                  cancelLabel={t('create.cancel')}
                  confirmLabel={t('create.confirm')}
                  onChange={setMoveDate}
                />
                <View className="flex-row justify-end gap-2">
                  <Button
                    label={t('create.cancel')}
                    variant="ghost"
                    onPress={() => setPendingMove(null)}
                  />
                  <Button
                    label={t('moveDate.confirm')}
                    disabled={!moveDate}
                    onPress={() => {
                      if (!pendingMove || !moveDate) return;
                      const requested = pendingMove;
                      setPendingMove(null);
                      void vm
                        .move(
                          requested.application,
                          requested.status,
                          requested.targetIndex,
                          moveDate,
                        )
                        .then(() =>
                          showSnackbar({
                            variant: 'success',
                            message: t('feedback.moved'),
                          }),
                        )
                        .catch(() =>
                          showSnackbar({
                            variant: 'error',
                            message: t('error.move'),
                          }),
                        );
                    }}
                  />
                </View>
              </Pressable>
            </Pressable>
          </Modal>
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

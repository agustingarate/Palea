import { Fragment, useEffect, useRef } from 'react';
import { Pressable, View } from 'react-native';
import {
  AppText,
  Badge,
  Button,
  CollectionFeedback,
  Icon,
  IconButton,
  type IconName,
  Surface,
} from '@palea/ui-native';
import type {
  Application,
  ApplicationStatus,
} from '../../domain/entities/Application';
import { ApplicationCard } from './ApplicationCard';
import { DropPlaceholder } from './DropPlaceholder';

type CardActionHandler = (
  application: Application,
  anchor: { x: number; y: number },
) => void;

export interface BoardColumnProps {
  status: ApplicationStatus;
  title: string;
  items: Application[];
  onAction: CardActionHandler;
  onOpen?: (application: Application) => void;
  onDrop: (application: Application, point: { x: number; y: number }) => void;
  onLayout: (x: number, y: number, width: number, height: number) => void;
  onCardLayout: (applicationId: string, y: number, height: number) => void;
  onDrag: (application: Application | null) => void;
  onDragMove: (point: { x: number; y: number }) => void;
  isDragSource: boolean;
  draggingId?: string;
  highlighted: boolean;
  total: number;
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  errorTitle: string;
  errorMessage: string;
  retryLabel: string;
  more: boolean;
  onMore: () => void;
  loadMoreLabel: string;
  emptyTitle: string;
  emptyDescription: string;
  dropIndex: number | null;
  onAdd: () => void;
  addLabel: string;
  dateLocale: string;
  workModeLabel: (workMode: Application['workMode']) => string;
  actionsLabel: string;
}

export function BoardColumn({
  status,
  title,
  items,
  onAction,
  onOpen,
  onDrop,
  onLayout,
  onCardLayout,
  onDrag,
  onDragMove,
  isDragSource,
  draggingId,
  highlighted,
  total,
  loading,
  error,
  onRetry,
  errorTitle,
  errorMessage,
  retryLabel,
  more,
  onMore,
  loadMoreLabel,
  emptyTitle,
  emptyDescription,
  dropIndex,
  onAdd,
  addLabel,
  dateLocale,
  workModeLabel,
  actionsLabel,
}: BoardColumnProps) {
  const containerRef = useRef<View>(null);
  const visualDropIndex = resolveVisualDropIndex(items, draggingId, dropIndex);
  return (
    <View
      ref={containerRef}
      style={{ zIndex: isDragSource ? 20 : 0 }}
      onLayout={() =>
        containerRef.current?.measureInWindow((x, y, width, height) =>
          onLayout(x, y, width, height),
        )
      }
    >
      <Surface
        variant="default"
        padding="none"
        className={`min-h-[520px] w-[304px] overflow-visible ${highlighted ? 'border-interaction dark:border-dark-interaction' : ''}`}
      >
        <View className="flex-row items-center gap-3 border-b border-border px-4 py-3 dark:border-dark-border">
          <Badge
            label={title}
            tone={statusTone(status)}
            leadingIcon={statusIcon(status)}
          />
          <View className="h-6 w-6 items-center justify-center rounded-full bg-surface-subtle dark:bg-dark-surface-subtle">
            <AppText variant="micro" tone="muted">
              {total}
            </AppText>
          </View>
          <View className="flex-1" />
          <IconButton
            icon="add"
            iconSize="sm"
            accessibilityLabel={addLabel}
            onPress={onAdd}
          />
        </View>
        <View
          className={`min-h-[456px] gap-2 rounded-b-md p-2 ${highlighted ? 'bg-interaction-subtle dark:bg-dark-interaction-subtle' : 'bg-surface-subtle dark:bg-dark-surface-subtle'}`}
        >
          {loading ? <CollectionFeedback status="loading" rows={3} /> : null}
          {error ? (
            <CollectionFeedback
              status="error"
              title={errorTitle}
              message={errorMessage}
              actionLabel={retryLabel}
              onAction={onRetry}
            />
          ) : null}
          {!loading && !error
            ? items.map((item, index) => (
                <Fragment key={item.id}>
                  {visualDropIndex === index ? <DropPlaceholder /> : null}
                  <ApplicationCard
                    application={item}
                    selected={draggingId === item.id}
                    onAction={onAction}
                    onOpen={onOpen}
                    onDrop={onDrop}
                    onDrag={onDrag}
                    onDragMove={onDragMove}
                    onMeasure={(y, height) => onCardLayout(item.id, y, height)}
                    workModeLabel={workModeLabel(item.workMode)}
                    actionsLabel={actionsLabel}
                    dateLocale={dateLocale}
                  />
                </Fragment>
              ))
            : null}
          {!loading && !error && visualDropIndex === items.length ? (
            <DropPlaceholder />
          ) : null}
          {!loading && !error && items.length === 0 ? (
            <View className="items-center justify-center gap-2 px-5 py-12">
              <View className="h-10 w-10 items-center justify-center rounded-full bg-surface dark:bg-dark-surface">
                <Icon name="briefcase" size="md" tone="muted" />
              </View>
              <AppText
                variant="bodySmall"
                tone="muted"
                className="font-inter-semibold text-center"
              >
                {emptyTitle}
              </AppText>
              <AppText variant="caption" tone="muted" className="text-center">
                {emptyDescription}
              </AppText>
            </View>
          ) : null}
          {!loading && !error && more ? (
            <Button
              label={loadMoreLabel}
              variant="secondary"
              onPress={onMore}
            />
          ) : null}
        </View>
      </Surface>
    </View>
  );
}

export interface ListGroupProps {
  status: ApplicationStatus;
  title: string;
  expanded: boolean;
  total: number;
  items: Application[];
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  errorTitle: string;
  errorMessage: string;
  retryLabel: string;
  dragging: Application | null;
  highlighted: boolean;
  dropIndex: number | null;
  onToggle: () => void;
  onDrag: (application: Application | null) => void;
  onDragMove: (position: number) => void;
  onAction: CardActionHandler;
  onOpen?: (application: Application) => void;
  onMore: () => void;
  more: boolean;
  onDrop: (application: Application, position: number) => void;
  onLayout: (y: number, height: number) => void;
  onCardLayout: (applicationId: string, y: number, height: number) => void;
  loadMoreLabel: string;
  addLabel: string;
  onAdd: () => void;
  workModeLabel: (workMode: Application['workMode']) => string;
  actionsLabel: string;
  layoutVersion: number;
  dateLocale: string;
}

export function ListGroup({
  status,
  title,
  expanded,
  total,
  items,
  loading,
  error,
  onRetry,
  errorTitle,
  errorMessage,
  retryLabel,
  dragging,
  highlighted,
  dropIndex,
  onToggle,
  onDrag,
  onDragMove,
  onAction,
  onOpen,
  onMore,
  more,
  onDrop,
  onLayout,
  onCardLayout,
  loadMoreLabel,
  addLabel,
  onAdd,
  workModeLabel,
  actionsLabel,
  layoutVersion,
  dateLocale,
}: ListGroupProps) {
  const containerRef = useRef<View>(null);
  const visualDropIndex = resolveVisualDropIndex(
    items,
    dragging?.id,
    dropIndex,
  );
  const isDragSource = Boolean(
    dragging && items.some((item) => item.id === dragging.id),
  );
  const measure = () =>
    containerRef.current?.measureInWindow((_x, y, _width, height) =>
      onLayout(y, height),
    );
  useEffect(() => {
    measure();
  }, [layoutVersion]);
  return (
    <View
      ref={containerRef}
      onLayout={measure}
      className="relative"
      style={{
        zIndex: isDragSource ? 100 : 0,
        elevation: isDragSource ? 12 : 0,
      }}
    >
      <Surface
        variant={dragging ? 'subtle' : 'default'}
        className={`gap-3 ${highlighted ? 'border-primary bg-primary-subtle dark:border-dark-primary dark:bg-dark-primary-subtle' : ''}`}
      >
        <View className="flex-row items-center gap-2">
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded }}
            onPress={onToggle}
            className="min-h-control-lg flex-1 flex-row items-center gap-2"
          >
            <Icon
              name={expanded ? 'chevronDown' : 'chevronRight'}
              size="sm"
              tone="muted"
            />
            <View className="flex-1">
              <Badge
                label={title}
                tone={statusTone(status)}
                leadingIcon={statusIcon(status)}
              />
            </View>
            <View className="min-w-6 items-center rounded-full bg-surface-subtle px-1.5 py-0.5 dark:bg-dark-surface-subtle">
              <AppText variant="label" tone="muted">
                {total}
              </AppText>
            </View>
          </Pressable>
          <IconButton
            icon="add"
            iconSize="sm"
            accessibilityLabel={addLabel}
            onPress={onAdd}
          />
        </View>
        {expanded ? (
          <View className="gap-3">
            {loading ? <CollectionFeedback status="loading" rows={3} /> : null}
            {error ? (
              <CollectionFeedback
                status="error"
                title={errorTitle}
                message={errorMessage}
                actionLabel={retryLabel}
                onAction={onRetry}
              />
            ) : null}
            {!loading && !error ? (
              <>
                {items.map((item, index) => (
                  <Fragment key={item.id}>
                    {visualDropIndex === index ? <DropPlaceholder /> : null}
                    <ApplicationCard
                      application={item}
                      selected={dragging?.id === item.id}
                      dragInitiation="immediate"
                      scrollOffset={layoutVersion}
                      onAction={onAction}
                      onOpen={onOpen}
                      onDrag={onDrag}
                      onDragMove={(point) => onDragMove(point.y)}
                      onDrop={(application, point) =>
                        onDrop(application, point.y)
                      }
                      onMeasure={(y, height) =>
                        onCardLayout(item.id, y, height)
                      }
                      workModeLabel={workModeLabel(item.workMode)}
                      actionsLabel={actionsLabel}
                      dateLocale={dateLocale}
                    />
                  </Fragment>
                ))}
                {visualDropIndex === items.length ? <DropPlaceholder /> : null}
                {more ? (
                  <Button
                    label={loadMoreLabel}
                    variant="secondary"
                    onPress={onMore}
                  />
                ) : null}
              </>
            ) : null}
          </View>
        ) : null}
      </Surface>
    </View>
  );
}

function statusTone(
  status: ApplicationStatus,
): 'neutral' | 'interaction' | 'success' | 'warning' | 'danger' {
  if (status === 'rejected') return 'danger';
  if (status === 'offer') return 'success';
  if (status === 'interview') return 'warning';
  if (status === 'applied') return 'interaction';
  return 'neutral';
}

function statusIcon(status: ApplicationStatus): IconName {
  if (status === 'draft') return 'circleDashed';
  if (status === 'applied') return 'stickyNoteCheck';
  if (status === 'interview') return 'messagesSquare';
  if (status === 'offer') return 'partyPopper';
  return 'heartCrack';
}

function resolveVisualDropIndex(
  items: Application[],
  draggingId: string | undefined,
  dropIndex: number | null,
) {
  if (dropIndex === null || !draggingId) return dropIndex;
  const sourceIndex = items.findIndex((item) => item.id === draggingId);
  return sourceIndex >= 0 && sourceIndex <= dropIndex
    ? dropIndex + 1
    : dropIndex;
}

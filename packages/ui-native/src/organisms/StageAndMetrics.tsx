import { useEffect, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import {
  createAnimatedComponent,
  FadeInDown,
  FadeOutUp,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { primitives } from '@palea/design-tokens';
import { AppText } from '../atoms/AppText';
import { Icon } from '../atoms/Icon';
import { Surface } from '../atoms/Surface';
import { Badge, Skeleton, type StatusTone } from '../atoms/VisualPrimitives';
import { FeedbackMessage } from '../molecules/Content';

const AnimatedView = createAnimatedComponent(View);

export interface StageGroupProps {
  title: string;
  count?: number;
  expanded: boolean;
  onToggle: () => void;
  children: ReactNode;
}

export function StageGroup({
  title,
  count,
  expanded,
  onToggle,
  children,
}: StageGroupProps) {
  const chevronRotation = useSharedValue(expanded ? 90 : 0);
  const chevronStyle = useAnimatedStyle(
    () => ({ transform: [{ rotate: `${chevronRotation.value}deg` }] }),
    [chevronRotation],
  );

  useEffect(() => {
    chevronRotation.value = withTiming(expanded ? 90 : 0, {
      duration: primitives.motion.duration.standard,
      reduceMotion: ReduceMotion.System,
    });
  }, [chevronRotation, expanded]);

  return (
    <View>
      <Surface padding="md" className="overflow-hidden">
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded }}
          className="min-h-control-md flex-row items-center gap-3 px-4"
          onPress={onToggle}
        >
          <AnimatedView style={chevronStyle}>
            <Icon name="chevronRight" size="md" tone="muted" />
          </AnimatedView>
          <AppText variant="label" className="flex-1 uppercase">
            {title}
          </AppText>
          {typeof count === 'number' ? <Badge label={String(count)} /> : null}
        </Pressable>
        {expanded ? (
          <AnimatedView
            className="border-border dark:border-dark-border m-10 gap-3 border-t p-3"
            entering={FadeInDown.duration(
              primitives.motion.duration.standard,
            ).reduceMotion(ReduceMotion.System)}
            exiting={FadeOutUp.duration(
              primitives.motion.duration.fast,
            ).reduceMotion(ReduceMotion.System)}
          >
            {children}
          </AnimatedView>
        ) : null}
      </Surface>
    </View>
  );
}

export interface TimelineItem {
  id: string;
  title: string;
  description?: string;
  date?: string;
  tone?: StatusTone;
  completed?: boolean;
  current?: boolean;
  statusLabel?: string;
  currentLabel?: string;
  warningLabel?: string;
  warningActionLabel?: string;
  onWarningPress?: () => void;
  actionLabel?: string;
  onPress?: () => void;
}

export function StageTimeline({ items }: { items: readonly TimelineItem[] }) {
  return (
    <View accessibilityRole="list" className="gap-1">
      {items.map((item, index) => {
        const completedMarkerClass =
          item.tone === 'danger'
            ? 'bg-danger dark:bg-dark-danger'
            : item.tone === 'warning'
              ? 'bg-warning dark:bg-dark-warning'
              : 'bg-success dark:bg-dark-success';
        const content = (
          <>
            <View className="items-center">
              <View
                testID={`stage-marker-${item.id}`}
                accessibilityElementsHidden
                className={`h-7 w-7 items-center justify-center rounded-full ${item.current ? 'border-text bg-surface dark:border-dark-text dark:bg-dark-surface border-[3px]' : item.completed ? completedMarkerClass : 'border-border bg-surface dark:border-dark-border dark:bg-dark-surface border-2'}`}
              >
                {item.current ? (
                  <View className="bg-text dark:bg-dark-text h-2 w-2 rounded-full" />
                ) : item.completed ? (
                  <Icon
                    name="check"
                    size="sm"
                    strokeWidth={2.5}
                    tone="inverse"
                  />
                ) : null}
              </View>
              {index < items.length - 1 ? (
                <View className="bg-border dark:bg-dark-border min-h-10 w-px flex-1" />
              ) : null}
            </View>
            <View className="min-w-0 flex-1 pb-4">
              <View
                className={`bg-surface dark:bg-dark-surface gap-3 rounded-md border px-4 py-3 ${item.current ? 'border-text dark:border-dark-text' : 'border-border dark:border-dark-border'}`}
              >
                <View className="flex-row items-start justify-between gap-3">
                  <View className="min-w-0 flex-1 gap-2">
                    <View className="flex-row flex-wrap items-center gap-2">
                      <AppText
                        numberOfLines={2}
                        className="font-inter-medium min-w-0 flex-shrink"
                      >
                        {item.title}
                      </AppText>
                      {item.current && item.currentLabel ? (
                        <View className="bg-text dark:bg-dark-text rounded-full px-2 py-1">
                          <AppText variant="micro" tone="inverse">
                            {item.currentLabel}
                          </AppText>
                        </View>
                      ) : null}
                    </View>
                    {item.date ? (
                      <View className="flex-row items-center gap-1.5">
                        <Icon name="calendar" size={13} tone="muted" />
                        <AppText variant="caption" tone="muted">
                          {item.date}
                        </AppText>
                      </View>
                    ) : null}
                  </View>
                  {item.statusLabel ? (
                    <Badge
                      label={item.statusLabel}
                      tone={item.tone ?? 'neutral'}
                    />
                  ) : null}
                </View>
                {item.warningLabel ? (
                  <View className="border-warning/40 flex-row flex-wrap items-center gap-x-2 gap-y-1 border-t pt-2">
                    <Icon name="error" size={14} tone="warning" />
                    <AppText
                      variant="caption"
                      tone="default"
                      className="min-w-0 flex-1"
                    >
                      {item.warningLabel}
                    </AppText>
                    {item.warningActionLabel && item.onWarningPress ? (
                      <Pressable
                        accessibilityRole="button"
                        className="min-h-touch-target justify-center rounded-sm px-1"
                        onPress={(event) => {
                          event.stopPropagation();
                          item.onWarningPress?.();
                        }}
                      >
                        <AppText
                          variant="caption"
                          tone="interaction"
                          className="font-semibold"
                        >
                          {item.warningActionLabel}
                        </AppText>
                      </Pressable>
                    ) : null}
                  </View>
                ) : null}
              </View>
            </View>
          </>
        );
        const accessibilityLabel = [
          item.title,
          item.statusLabel,
          item.description,
          item.date,
          item.current ? item.currentLabel : undefined,
          item.warningLabel,
        ]
          .filter(Boolean)
          .join(', ');
        return item.onPress ? (
          <Pressable
            key={item.id}
            accessibilityLabel={item.actionLabel ?? accessibilityLabel}
            accessibilityRole="button"
            className="min-h-touch-target flex-row gap-3 rounded-md"
            onPress={item.onPress}
          >
            {content}
          </Pressable>
        ) : (
          <View
            key={item.id}
            accessible
            accessibilityLabel={accessibilityLabel}
            className="flex-row gap-3"
          >
            {content}
          </View>
        );
      })}
    </View>
  );
}

export interface MetricBarItem {
  label: string;
  value: number;
  tone?: 'default' | 'interaction';
}

export function MetricBars({
  items,
  maxValue,
}: {
  items: readonly MetricBarItem[];
  maxValue?: number;
}) {
  const maximum = Math.max(
    maxValue ?? 0,
    ...items.map((item) => item.value),
    1,
  );
  return (
    <View className="gap-3">
      {items.map((item) => (
        <View
          key={item.label}
          accessibilityLabel={`${item.label}: ${item.value}`}
          className="gap-1"
        >
          <View className="flex-row justify-between">
            <AppText variant="label" tone="muted">
              {item.label}
            </AppText>
            <AppText variant="label">{item.value}</AppText>
          </View>
          <View className="bg-surface-subtle dark:bg-dark-surface-subtle h-3 overflow-hidden rounded-full">
            <View
              className={`h-full rounded-full ${item.tone === 'interaction' ? 'bg-interaction dark:bg-dark-interaction' : 'bg-primary dark:bg-dark-primary'}`}
              style={{ width: `${(item.value / maximum) * 100}%` }}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

export function FunnelChart({ items }: { items: readonly MetricBarItem[] }) {
  const maximum = Math.max(...items.map((item) => item.value), 1);
  return (
    <View accessibilityLabel="Conversion funnel" className="items-center gap-2">
      {items.map((item, index) => (
        <View
          key={item.label}
          className={`min-h-10 items-center justify-center rounded-sm ${index === items.length - 1 ? 'bg-interaction dark:bg-dark-interaction' : 'bg-primary dark:bg-dark-primary'}`}
          style={{ width: `${Math.max((item.value / maximum) * 100, 28)}%` }}
        >
          <AppText variant="label" tone="inverse">
            {item.label} · {item.value}
          </AppText>
        </View>
      ))}
    </View>
  );
}

export type CollectionState =
  | { status: 'content'; children: ReactNode }
  | { status: 'loading'; rows?: number }
  | {
      status: 'empty';
      title: string;
      message: string;
      actionLabel?: string;
      onAction?: () => void;
    }
  | {
      status: 'error';
      title: string;
      message: string;
      actionLabel?: string;
      onAction?: () => void;
    };

export function CollectionFeedback(state: CollectionState) {
  if (state.status === 'content') return <>{state.children}</>;
  if (state.status === 'loading')
    return (
      <View accessibilityLabel="Loading content" className="gap-3">
        {Array.from({ length: state.rows ?? 3 }, (_, index) => (
          <Surface key={index} className="gap-3">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-10 w-full" />
          </Surface>
        ))}
      </View>
    );
  return (
    <FeedbackMessage
      title={state.title}
      message={state.message}
      tone={state.status === 'error' ? 'danger' : 'info'}
      actionLabel={state.actionLabel}
      onAction={state.onAction}
      icon={state.status === 'empty' ? 'folder' : 'error'}
    />
  );
}

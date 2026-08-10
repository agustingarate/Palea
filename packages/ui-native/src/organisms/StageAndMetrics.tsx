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
}

export function StageTimeline({ items }: { items: readonly TimelineItem[] }) {
  return (
    <View accessibilityRole="list">
      {items.map((item, index) => (
        <View
          key={item.id}
          accessible
          accessibilityLabel={[item.title, item.description, item.date]
            .filter(Boolean)
            .join(', ')}
          className="flex-row gap-3"
        >
          <View className="items-center">
            <View
              className={`h-6 w-6 items-center justify-center rounded-full ${item.completed ? 'bg-interaction dark:bg-dark-interaction' : 'border-border bg-surface dark:border-dark-border dark:bg-dark-surface border'}`}
            >
              {item.completed ? (
                <Icon name="check" size="sm" tone="inverse" />
              ) : null}
            </View>
            {index < items.length - 1 ? (
              <View className="bg-border dark:bg-dark-border min-h-12 w-px flex-1" />
            ) : null}
          </View>
          <View className="flex-1 pb-5">
            <View className="flex-row items-start gap-2">
              <AppText className="font-inter-medium flex-1">
                {item.title}
              </AppText>
              {item.tone ? (
                <Badge
                  label={item.completed ? 'Done' : 'Pending'}
                  tone={item.tone}
                />
              ) : null}
            </View>
            {item.description ? (
              <AppText variant="bodySmall" tone="muted">
                {item.description}
              </AppText>
            ) : null}
            {item.date ? (
              <AppText variant="label" tone="muted">
                {item.date}
              </AppText>
            ) : null}
          </View>
        </View>
      ))}
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

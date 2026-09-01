import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import {
  createAnimatedComponent,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  ZoomIn,
  ZoomOut,
} from 'react-native-reanimated';
import { primitives } from '@palea/design-tokens';
import { AppText } from '../atoms/AppText';
import { Icon, type IconName } from '../atoms/Icon';
import { usePressFeedback } from '../internal/usePressFeedback';
import { useThemeColors } from '../internal/useThemeColors';

const AnimatedView = createAnimatedComponent(View);

export interface CheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  error?: string;
}

export function Checkbox({
  label,
  checked,
  onChange,
  disabled = false,
  error,
}: CheckboxProps) {
  const [focused, setFocused] = useState(false);
  const press = usePressFeedback('control');
  return (
    <AnimatedView className="gap-1" style={press.animatedStyle}>
      <Pressable
        accessibilityLabel={label}
        accessibilityRole="checkbox"
        accessibilityState={{ checked, disabled }}
        accessibilityHint={error}
        className={`min-h-touch-target flex-row items-center gap-3 ${disabled ? 'opacity-disabled' : ''}`}
        disabled={disabled}
        onBlur={() => setFocused(false)}
        onFocus={() => setFocused(true)}
        onPressIn={press.onPressIn}
        onPressOut={press.onPressOut}
        onPress={() => onChange(!checked)}
      >
        <View
          className={`h-6 w-6 items-center justify-center rounded-sm border ${checked ? 'border-interaction bg-interaction dark:border-dark-interaction dark:bg-dark-interaction' : error ? 'border-danger dark:border-dark-danger' : focused ? 'border-focus-ring dark:border-dark-focus-ring' : 'border-border bg-surface dark:border-dark-border dark:bg-dark-surface'}`}
        >
          {checked ? (
            <AnimatedView
              entering={ZoomIn.duration(
                primitives.motion.duration.fast,
              ).reduceMotion(ReduceMotion.System)}
              exiting={ZoomOut.duration(
                primitives.motion.duration.fast,
              ).reduceMotion(ReduceMotion.System)}
            >
              <Icon name="check" size="sm" tone="inverse" />
            </AnimatedView>
          ) : null}
        </View>
        <AppText className="flex-1">{label}</AppText>
      </Pressable>
      {error ? (
        <AppText variant="label" tone="danger">
          {error}
        </AppText>
      ) : null}
    </AnimatedView>
  );
}

export interface SelectionItem {
  value: string;
  label: string;
  icon?: IconName;
  disabled?: boolean;
}

export interface SegmentedControlProps {
  items: readonly SelectionItem[];
  value: string;
  onValueChange: (value: string) => void;
  label: string;
  disabled?: boolean;
  compact?: boolean;
  hideLabel?: boolean;
}

export function SegmentedControl({
  items,
  value,
  onValueChange,
  label,
  disabled = false,
  compact = false,
  hideLabel = false,
}: SegmentedControlProps) {
  const theme = useThemeColors();
  const [containerWidth, setContainerWidth] = useState(0);
  const activeIndex = Math.max(
    items.findIndex((item) => item.value === value),
    0,
  );
  const indicatorX = useSharedValue(0);
  const indicatorWidth =
    containerWidth > 0 ? (containerWidth - 8) / Math.max(items.length, 1) : 0;
  const indicatorStyle = useAnimatedStyle(
    () => ({ transform: [{ translateX: indicatorX.value }] }),
    [indicatorX],
  );

  useEffect(() => {
    indicatorX.value = withTiming(indicatorWidth * activeIndex, {
      duration: primitives.motion.duration.standard,
      reduceMotion: ReduceMotion.System,
    });
  }, [activeIndex, indicatorWidth, indicatorX]);

  return (
    <View className="gap-1">
      {!hideLabel ? <AppText variant="label">{label}</AppText> : null}
      <View
        accessibilityLabel={label}
        accessibilityRole="radiogroup"
        className={`bg-surface-subtle dark:bg-dark-surface-subtle flex-row overflow-hidden rounded-md p-1 ${compact ? 'self-end' : ''} ${disabled ? 'opacity-disabled' : ''}`}
        onLayout={(event) => setContainerWidth(event.nativeEvent.layout.width)}
      >
        {indicatorWidth > 0 ? (
          <AnimatedView
            pointerEvents="none"
            style={[
              indicatorStyle,
              {
                backgroundColor: theme.background,
                borderColor: theme.skeleton,
                borderRadius: 6,
                borderWidth: 1,
                bottom: 4,
                left: 4,
                position: 'absolute',
                top: 4,
                width: indicatorWidth,
              },
            ]}
          />
        ) : null}
        {items.map((item) => {
          const selected = item.value === value;
          return (
            <Pressable
              key={item.value}
              accessibilityRole="radio"
              accessibilityLabel={item.label}
              accessibilityState={{
                checked: selected,
                disabled: disabled || item.disabled,
              }}
              className={`min-h-control-sm relative z-10 items-center justify-center overflow-hidden rounded-sm ${compact ? 'w-control-sm' : 'flex-1 px-2'}`}
              disabled={disabled || item.disabled}
              onPress={() => onValueChange(item.value)}
            >
              {item.icon ? (
                <Icon
                  name={item.icon}
                  size="md"
                  tone={selected ? 'interaction' : 'muted'}
                />
              ) : (
                <AppText
                  className="z-10"
                  variant="label"
                  tone={selected ? 'interaction' : 'muted'}
                  style={selected ? { color: theme.text } : undefined}
                >
                  {item.label}
                </AppText>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export interface TabsProps extends Omit<SegmentedControlProps, 'label'> {
  accessibilityLabel: string;
}

export function Tabs({
  items,
  value,
  onValueChange,
  accessibilityLabel,
  disabled,
}: TabsProps) {
  const theme = useThemeColors();
  const [containerWidth, setContainerWidth] = useState(0);
  const activeIndex = Math.max(
    items.findIndex((item) => item.value === value),
    0,
  );
  const indicatorX = useSharedValue(0);
  const indicatorWidth =
    containerWidth > 0 ? containerWidth / Math.max(items.length, 1) : 0;
  const indicatorStyle = useAnimatedStyle(
    () => ({ transform: [{ translateX: indicatorX.value }] }),
    [indicatorX],
  );

  useEffect(() => {
    indicatorX.value = withTiming(indicatorWidth * activeIndex, {
      duration: primitives.motion.duration.standard,
      reduceMotion: ReduceMotion.System,
    });
  }, [activeIndex, indicatorWidth, indicatorX]);

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="tablist"
      className="border-border dark:border-dark-border relative flex-row border-b"
      onLayout={(event) => setContainerWidth(event.nativeEvent.layout.width)}
    >
      {indicatorWidth > 0 ? (
        <AnimatedView
          pointerEvents="none"
          style={[
            indicatorStyle,
            {
              backgroundColor: theme.interaction,
              bottom: 0,
              height: 2,
              left: 0,
              position: 'absolute',
              width: indicatorWidth,
            },
          ]}
        />
      ) : null}
      {items.map((item) => {
        const selected = item.value === value;
        return (
          <Pressable
            key={item.value}
            accessibilityRole="tab"
            accessibilityState={{
              selected,
              disabled: disabled || item.disabled,
            }}
            className={`min-h-control-md relative z-10 flex-1 items-center justify-center overflow-hidden px-2 ${disabled || item.disabled ? 'opacity-disabled' : ''}`}
            disabled={disabled || item.disabled}
            onPress={() => onValueChange(item.value)}
          >
            <AppText
              className="z-10"
              variant="bodySmall"
              tone={selected ? 'interaction' : 'muted'}
              style={selected ? { color: theme.interactionPressed } : undefined}
            >
              {item.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

export interface ProgressIndicatorProps {
  current: number;
  total: number;
  label?: string;
}

export function ProgressIndicator({
  current,
  total,
  label,
}: ProgressIndicatorProps) {
  const safeTotal = Math.max(total, 1);
  const safeCurrent = Math.min(Math.max(current, 0), safeTotal);
  const percent = (safeCurrent / safeTotal) * 100;
  return (
    <View
      accessibilityLabel={label ?? `Step ${safeCurrent} of ${safeTotal}`}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: safeTotal, now: safeCurrent }}
      className="gap-2"
    >
      {label ? (
        <AppText variant="label" tone="muted">
          {label}
        </AppText>
      ) : null}
      <View className="bg-surface-subtle dark:bg-dark-surface-subtle h-2 overflow-hidden rounded-full">
        <View
          className="bg-interaction dark:bg-dark-interaction h-full rounded-full"
          style={{ width: `${percent}%` }}
        />
      </View>
    </View>
  );
}

import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  type ImageSourcePropType,
  type PressableProps,
  View,
  type ViewProps,
} from 'react-native';
import {
  createAnimatedComponent,
  interpolateColor,
  ReduceMotion,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  ZoomIn,
  ZoomOut,
} from 'react-native-reanimated';
import { primitives } from '@palea/design-tokens';
import { AppText } from './AppText';
import { Icon, type IconName, type IconSize } from './Icon';
import { useThemeColors } from '../internal/useThemeColors';
import { usePressFeedback } from '../internal/usePressFeedback';

const AnimatedView = createAnimatedComponent(View);

export function Divider({
  className = '',
  ...props
}: ViewProps & { className?: string }) {
  return (
    <View
      className={`bg-border dark:bg-dark-border h-px ${className}`}
      {...props}
    />
  );
}

export type StatusTone =
  'neutral' | 'interaction' | 'success' | 'warning' | 'danger' | 'info';

const badgeClasses: Record<StatusTone, string> = {
  neutral: 'bg-surface-subtle dark:bg-dark-surface-subtle',
  interaction: 'bg-interaction-subtle dark:bg-dark-interaction-subtle',
  success: 'bg-success-subtle dark:bg-dark-success-subtle',
  warning: 'bg-warning-subtle dark:bg-dark-warning-subtle',
  danger: 'bg-danger-subtle dark:bg-dark-danger-subtle',
  info: 'bg-info-subtle dark:bg-dark-info-subtle',
};

const badgeBorderClasses: Record<StatusTone, string> = {
  neutral: 'border-border dark:border-dark-border',
  interaction: 'border-interaction dark:border-dark-interaction',
  success: 'border-success dark:border-dark-success',
  warning: 'border-warning dark:border-dark-warning',
  danger: 'border-danger dark:border-dark-danger',
  info: 'border-info dark:border-dark-info',
};

const toneMap = {
  neutral: 'muted',
  interaction: 'interaction',
  success: 'success',
  warning: 'warning',
  danger: 'danger',
  info: 'info',
} as const;

export function Badge({
  label,
  tone = 'neutral',
  leadingIcon,
  outlined = false,
}: {
  label: string;
  tone?: StatusTone;
  leadingIcon?: IconName;
  outlined?: boolean;
}) {
  return (
    <View
      className={`w-min flex-row items-center gap-1 rounded-sm px-2 py-1 ${outlined ? 'bg-transparent' : badgeClasses[tone]} ${outlined ? `border ${badgeBorderClasses[tone]}` : ''}`}
    >
      {leadingIcon ? (
        <Icon name={leadingIcon} size={12} tone={toneMap[tone]} />
      ) : null}
      <AppText variant="label" tone={toneMap[tone]}>
        {label}
      </AppText>
    </View>
  );
}

export interface ChipProps extends Omit<PressableProps, 'children'> {
  label: string;
  size?: 'sm' | 'md';
  selected?: boolean;
  disabled?: boolean;
  onRemove?: () => void;
}

export function Chip({
  label,
  size = 'md',
  selected = false,
  disabled = false,
  onRemove,
  onPress,
  ...props
}: ChipProps) {
  const press = usePressFeedback('control');
  const theme = useThemeColors();
  const selection = useSharedValue(selected ? 1 : 0);
  const selectionStyle = useAnimatedStyle(
    () => ({
      backgroundColor: interpolateColor(
        selection.value,
        [0, 1],
        [theme.surface, theme.interactionSubtle],
      ),
      borderColor: interpolateColor(
        selection.value,
        [0, 1],
        [theme.border, theme.interaction],
      ),
    }),
    [
      selection,
      theme.border,
      theme.interaction,
      theme.interactionSubtle,
      theme.surface,
    ],
  );
  useEffect(() => {
    selection.value = withTiming(selected ? 1 : 0, {
      duration: primitives.motion.duration.fast,
      reduceMotion: ReduceMotion.System,
    });
  }, [selected, selection]);
  const content = (
    <>
      {selected ? (
        <AnimatedView
          entering={ZoomIn.duration(
            primitives.motion.duration.fast,
          ).reduceMotion(ReduceMotion.System)}
          exiting={ZoomOut.duration(
            primitives.motion.duration.fast,
          ).reduceMotion(ReduceMotion.System)}
        >
          <Icon name="check" size="sm" tone="interaction" />
        </AnimatedView>
      ) : null}
      <AppText
        variant={size === 'sm' ? 'label' : 'bodySmall'}
        tone={selected ? 'interaction' : 'default'}
      >
        {label}
      </AppText>
    </>
  );
  return (
    <AnimatedView
      style={[
        {
          alignItems: 'center',
          alignSelf: 'flex-start',
          borderRadius: primitives.radius.full,
          borderWidth: 1,
          flexDirection: 'row',
          gap: primitives.spacing.xs,
          minHeight: size === 'sm' ? 24 : primitives.size.controlSm,
          opacity: disabled ? primitives.opacity.disabled : 1,
          paddingHorizontal: size === 'sm' ? primitives.spacing.sm : 12,
        },
        selectionStyle,
        press.animatedStyle,
      ]}
    >
      {onPress ? (
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected, disabled }}
          className="min-h-control-sm flex-row items-center gap-1"
          disabled={disabled}
          {...props}
          onPressIn={(event) => {
            press.onPressIn();
            props.onPressIn?.(event);
          }}
          onPressOut={(event) => {
            press.onPressOut();
            props.onPressOut?.(event);
          }}
          onPress={onPress}
        >
          {content}
        </Pressable>
      ) : (
        content
      )}
      {onRemove ? (
        <Pressable
          accessibilityLabel={`Remove ${label}`}
          accessibilityRole="button"
          hitSlop={8}
          onPress={onRemove}
        >
          <Icon name="close" size="sm" tone="muted" />
        </Pressable>
      ) : null}
    </AnimatedView>
  );
}

export interface AvatarProps {
  source?: ImageSourcePropType;
  initials?: string;
  size?: 'sm' | 'md' | 'lg';
  accessibilityLabel: string;
}

export function Avatar({
  source,
  initials = '?',
  size = 'md',
  accessibilityLabel,
}: AvatarProps) {
  const classes = {
    sm: 'h-avatar-sm w-avatar-sm',
    md: 'h-avatar-md w-avatar-md',
    lg: 'h-avatar-lg w-avatar-lg',
  }[size];
  if (source)
    return (
      <Image
        accessibilityLabel={accessibilityLabel}
        className={`${classes} rounded-full`}
        source={source}
      />
    );
  return (
    <View
      accessibilityLabel={accessibilityLabel}
      className={`${classes} bg-primary-subtle dark:bg-dark-primary-subtle items-center justify-center rounded-full`}
    >
      <AppText variant="label">{initials.slice(0, 2).toUpperCase()}</AppText>
    </View>
  );
}

export function Spinner({ label = 'Loading' }: { label?: string }) {
  const theme = useThemeColors();
  return (
    <ActivityIndicator accessibilityLabel={label} color={theme.interaction} />
  );
}

export function Skeleton({
  className = '',
  ...props
}: ViewProps & { className?: string }) {
  const progress = useSharedValue(0);
  const style = useAnimatedStyle(
    () => ({
      opacity: 0.72,
      transform: [{ translateX: `${progress.value * 220 - 110}%` }],
    }),
    [progress],
  );
  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, {
        duration: primitives.motion.duration.shimmer,
        reduceMotion: ReduceMotion.System,
      }),
      -1,
      false,
    );
    return () => cancelAnimation(progress);
  }, [progress]);
  return (
    <View
      accessibilityElementsHidden
      className={`bg-skeleton dark:bg-dark-skeleton min-h-4 overflow-hidden rounded-sm ${className}`}
      {...props}
    >
      <AnimatedView
        className="bg-skeleton-highlight dark:bg-dark-skeleton-highlight h-full w-1/2 rounded-full"
        style={style}
      />
    </View>
  );
}

export interface IconButtonProps extends Omit<PressableProps, 'children'> {
  icon: IconName;
  accessibilityLabel: string;
  tone?: 'default' | 'interaction' | 'danger';
  iconSize?: IconSize;
}

export function IconButton({
  icon,
  accessibilityLabel,
  tone = 'default',
  iconSize = 'lg',
  disabled,
  ...props
}: IconButtonProps) {
  const press = usePressFeedback('icon');
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);
  return (
    <AnimatedView style={press.animatedStyle}>
      <Pressable
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        accessibilityState={{ disabled: Boolean(disabled) }}
        className={`h-touch-target w-touch-target items-center justify-center rounded-full border ${focused ? 'border-focus-ring dark:border-dark-focus-ring' : 'border-transparent'} ${disabled ? 'opacity-disabled' : ''}`}
        disabled={disabled}
        {...props}
        onHoverIn={(event) => {
          setHovered(true);
          props.onHoverIn?.(event);
        }}
        onHoverOut={(event) => {
          setHovered(false);
          props.onHoverOut?.(event);
        }}
        onFocus={(event) => {
          setFocused(true);
          props.onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          props.onBlur?.(event);
        }}
        onPressIn={(event) => {
          press.onPressIn();
          props.onPressIn?.(event);
        }}
        onPressOut={(event) => {
          press.onPressOut();
          props.onPressOut?.(event);
        }}
      >
        <View
          className={`h-8 w-8 items-center justify-center rounded-full ${tone === 'interaction' ? 'bg-interaction-subtle dark:bg-dark-interaction-subtle' : tone === 'danger' ? 'bg-danger-subtle dark:bg-dark-danger-subtle' : hovered ? 'bg-surface-subtle/50 dark:bg-dark-surface-subtle/50' : ''}`}
        >
          <Icon
            name={icon}
            size={iconSize}
            tone={tone === 'default' ? 'default' : tone}
          />
        </View>
      </Pressable>
    </AnimatedView>
  );
}

export interface FloatingActionButtonProps extends Omit<
  PressableProps,
  'children'
> {
  icon: IconName;
  accessibilityLabel: string;
}

export function FloatingActionButton({
  icon,
  accessibilityLabel,
  disabled,
  ...props
}: FloatingActionButtonProps) {
  const press = usePressFeedback('icon');
  return (
    <AnimatedView style={press.animatedStyle}>
      <Pressable
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        accessibilityState={{ disabled: Boolean(disabled) }}
        className={`h-fab w-fab bg-primary shadow-elevated dark:bg-dark-primary items-center justify-center rounded-full ${disabled ? 'opacity-disabled' : ''}`}
        disabled={disabled}
        {...props}
        onPressIn={(event) => {
          press.onPressIn();
          props.onPressIn?.(event);
        }}
        onPressOut={(event) => {
          press.onPressOut();
          props.onPressOut?.(event);
        }}
      >
        <Icon name={icon} tone="inverse" />
      </Pressable>
    </AnimatedView>
  );
}

import { useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  View,
  type PressableProps,
} from 'react-native';
import {
  createAnimatedComponent,
  interpolateColor,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';
import { primitives } from '@palea/design-tokens';
import { useThemeColors } from '../internal/useThemeColors';
import { usePressFeedback } from '../internal/usePressFeedback';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<
  PressableProps,
  'children' | 'disabled'
> {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  leadingIcon?: IconName;
  trailingIcon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  accessory?: ReactNode;
}

const sizeStyles: Record<
  ButtonSize,
  { minHeight: number; paddingHorizontal: number }
> = {
  sm: { minHeight: primitives.size.controlSm, paddingHorizontal: 12 },
  md: { minHeight: primitives.size.controlMd, paddingHorizontal: 16 },
  lg: { minHeight: primitives.size.controlLg, paddingHorizontal: 20 },
};

const AnimatedView = createAnimatedComponent(View);
const AnimatedPressable = createAnimatedComponent(Pressable);

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  leadingIcon,
  trailingIcon,
  loading = false,
  disabled = false,
  fullWidth = false,
  accessory,
  accessibilityState,
  className: _className,
  onFocus,
  onBlur,
  onPressIn,
  onPressOut,
  style,
  ...props
}: ButtonProps) {
  const [focused, setFocused] = useState(false);
  const press = usePressFeedback('control');
  const theme = useThemeColors();
  const pressProgress = useSharedValue(0);
  const blocked = disabled || loading;
  const isInverse = variant === 'primary' || variant === 'destructive';
  const background = {
    primary: { idle: theme.primary, pressed: theme.primaryPressed },
    secondary: { idle: theme.surface, pressed: theme.primarySubtle },
    ghost: { idle: 'rgba(0,0,0,0)', pressed: theme.primarySubtle },
    destructive: { idle: theme.danger, pressed: '#9F2020' },
  }[variant];
  const borderColor = {
    primary: theme.primary,
    secondary: theme.border,
    ghost: 'transparent',
    destructive: theme.danger,
  }[variant];
  const pressedStyle = useAnimatedStyle(
    () => ({
      backgroundColor: interpolateColor(
        pressProgress.value,
        [0, 1],
        [background.idle, background.pressed],
      ),
    }),
    [background.idle, background.pressed, pressProgress],
  );

  const setPressed = (pressed: boolean) => {
    pressProgress.value = withTiming(pressed ? 1 : 0, {
      duration: primitives.motion.duration.fast,
      reduceMotion: ReduceMotion.System,
    });
  };

  return (
    <AnimatedView
      style={[press.animatedStyle, fullWidth ? { width: '100%' } : undefined]}
    >
      <AnimatedPressable
        accessibilityRole="button"
        accessibilityState={{
          ...accessibilityState,
          busy: loading,
          disabled: blocked,
        }}
        disabled={blocked}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onPressIn={(event) => {
          press.onPressIn();
          setPressed(true);
          onPressIn?.(event);
        }}
        onPressOut={(event) => {
          press.onPressOut();
          setPressed(false);
          onPressOut?.(event);
        }}
        {...props}
        style={[
          {
            alignItems: 'center',
            borderColor: focused ? theme.focusRing : borderColor,
            borderRadius: primitives.radius.md,
            borderWidth: 1,
            flexDirection: 'row',
            gap: primitives.spacing.sm,
            justifyContent: 'center',
            opacity: blocked ? primitives.opacity.disabled : 1,
            width: fullWidth ? '100%' : undefined,
            ...sizeStyles[size],
          },
          pressedStyle,
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator
            color={isInverse ? theme.onPrimary : theme.text}
            size="small"
          />
        ) : leadingIcon ? (
          <Icon
            name={leadingIcon}
            size="md"
            tone={isInverse ? 'inverse' : 'default'}
          />
        ) : null}
        <AppText
          variant="bodySmall"
          tone={isInverse ? 'inverse' : 'default'}
          className="font-medium"
        >
          {label}
        </AppText>
        {accessory ??
          (trailingIcon ? (
            <Icon
              name={trailingIcon}
              size="md"
              tone={isInverse ? 'inverse' : 'default'}
            />
          ) : null)}
      </AnimatedPressable>
    </AnimatedView>
  );
}

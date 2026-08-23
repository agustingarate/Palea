import { useState } from 'react';
import { Pressable, View, type ViewProps } from 'react-native';
import {
  createAnimatedComponent,
  FadeInDown,
  FadeOutDown,
  ReduceMotion,
} from 'react-native-reanimated';
import { primitives } from '@palea/design-tokens';
import { AppText } from '../atoms/AppText';
import { Icon, type IconName, type IconTone } from '../atoms/Icon';
import { Surface } from '../atoms/Surface';
import { useThemeColors } from '../internal/useThemeColors';
export type SnackbarVariant = 'success' | 'error' | 'warning' | 'info';
export interface SnackbarProps extends Omit<ViewProps, 'children'> {
  message: string;
  variant?: SnackbarVariant;
  actionLabel?: string;
  onAction?: () => void;
  onDismiss?: () => void;
  dismissAccessibilityLabel?: string;
}
const AnimatedView = createAnimatedComponent(View);
const metadata: Record<
  SnackbarVariant,
  { icon: IconName; tone: IconTone; announcement: 'assertive' | 'polite' }
> = {
  success: { icon: 'checkCircle', tone: 'success', announcement: 'polite' },
  error: { icon: 'error', tone: 'danger', announcement: 'assertive' },
  warning: { icon: 'error', tone: 'warning', announcement: 'assertive' },
  info: { icon: 'info', tone: 'info', announcement: 'polite' },
};
export function Snackbar({
  message,
  variant = 'info',
  actionLabel,
  onAction,
  onDismiss,
  dismissAccessibilityLabel = 'Cerrar notificación',
  style,
  ...props
}: SnackbarProps) {
  const theme = useThemeColors();
  const [focused, setFocused] = useState(false);
  const item = metadata[variant];
  const accent = {
    success: theme.success,
    error: theme.danger,
    warning: theme.warning,
    info: theme.info,
  }[variant];
  return (
    <AnimatedView
      entering={FadeInDown.duration(
        primitives.motion.duration.emphasized,
      ).reduceMotion(ReduceMotion.System)}
      exiting={FadeOutDown.duration(
        primitives.motion.duration.standard,
      ).reduceMotion(ReduceMotion.System)}
    >
      <Surface
        {...props}
        className="shadow-elevated w-full max-w-xl flex-row items-center gap-3 overflow-hidden"
        padding="sm"
        style={[{ borderLeftColor: accent, borderLeftWidth: 4 }, style]}
        variant="elevated"
      >
        <View className="h-10 w-10 items-center justify-center rounded-full">
          <Icon name={item.icon} size="lg" tone={item.tone} />
        </View>
        <AppText
          accessible
          accessibilityLiveRegion={item.announcement}
          accessibilityRole="alert"
          className="min-w-0 flex-1"
          variant="bodySmall"
        >
          {message}
        </AppText>
        {actionLabel && onAction ? (
          <Pressable
            accessibilityRole="button"
            className="min-h-control-md justify-center rounded-sm px-2"
            onPress={onAction}
          >
            <AppText
              className="font-inter-semibold"
              tone="interaction"
              variant="label"
            >
              {actionLabel}
            </AppText>
          </Pressable>
        ) : null}
        {onDismiss ? (
          <Pressable
            accessibilityLabel={dismissAccessibilityLabel}
            accessibilityRole="button"
            className="h-control-md w-control-md items-center justify-center rounded-full"
            onBlur={() => setFocused(false)}
            onFocus={() => setFocused(true)}
            onPress={onDismiss}
            style={{
              borderColor: focused ? theme.focusRing : 'transparent',
              borderWidth: 2,
            }}
          >
            <Icon name="close" size="md" tone="muted" />
          </Pressable>
        ) : null}
      </Surface>
    </AnimatedView>
  );
}

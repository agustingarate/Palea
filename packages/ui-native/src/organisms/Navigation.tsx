import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import {
  createAnimatedComponent,
  FadeIn,
  FadeOut,
  ReduceMotion,
} from 'react-native-reanimated';
import { primitives } from '@palea/design-tokens';
import { AppText } from '../atoms/AppText';
import { Icon, type IconName } from '../atoms/Icon';
import { useResponsiveLayout } from '../internal/useResponsiveLayout';
import { useThemeColors } from '../internal/useThemeColors';

const AnimatedView = createAnimatedComponent(View);

export interface TopAppBarProps {
  title: string;
  subtitle?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
}

export function TopAppBar({
  title,
  subtitle,
  leading,
  trailing,
}: TopAppBarProps) {
  const layout = useResponsiveLayout();
  return (
    <View className="border-border bg-background dark:border-dark-border dark:bg-dark-background border-b">
      <View
        className="min-h-control-lg w-full flex-row items-center gap-3"
        style={{
          alignSelf: 'center',
          maxWidth: layout.contentMaxWidth,
          paddingHorizontal: layout.pageGutter,
        }}
      >
        <View className="w-touch-target items-start">{leading}</View>
        <View
          className={`flex-1 ${layout.isExpanded ? 'items-start' : 'items-center'}`}
        >
          <AppText variant="sectionTitle" numberOfLines={1}>
            {title}
          </AppText>
          {subtitle ? (
            <AppText variant="label" tone="muted" numberOfLines={1}>
              {subtitle}
            </AppText>
          ) : null}
        </View>
        <View className="w-touch-target items-end">{trailing}</View>
      </View>
    </View>
  );
}

export interface BottomNavigationItem {
  value: string;
  label: string;
  icon: IconName;
  /** A concise unread-count label announced with the navigation item. */
  unreadCount?: string;
  disabled?: boolean;
}

export interface BottomNavigationProps {
  items: readonly BottomNavigationItem[];
  value: string;
  onValueChange: (value: string) => void;
  accessibilityLabel?: string;
  /** `auto` becomes a bottom bar on mobile and a horizontal navigation on web. */
  variant?: 'auto' | 'bottom' | 'horizontal';
}

export function BottomNavigation({
  items,
  value,
  onValueChange,
  accessibilityLabel = 'Main navigation',
  variant = 'auto',
}: BottomNavigationProps) {
  const layout = useResponsiveLayout();
  const theme = useThemeColors();
  const horizontal =
    variant === 'horizontal' || (variant === 'auto' && layout.isExpanded);
  return (
    <View
      className={`border-border bg-surface dark:border-dark-border dark:bg-dark-surface ${horizontal ? 'border-b' : 'border-t'}`}
    >
      <View
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="tablist"
        className={`flex-row self-center ${horizontal ? 'justify-start gap-2 px-6 py-2' : 'px-2 pt-1 pb-2'}`}
        style={{ width: '100%', maxWidth: layout.contentMaxWidth }}
      >
        {items.map((item) => {
          const selected = item.value === value;
          return (
            <Pressable
              accessibilityLabel={
                item.unreadCount
                  ? `${item.label}, ${item.unreadCount} unread notifications`
                  : item.label
              }
              key={item.value}
              accessibilityRole="tab"
              accessibilityState={{ selected, disabled: item.disabled }}
              className={`min-h-control-lg relative items-center justify-center overflow-hidden rounded-md ${horizontal ? 'flex-row gap-2 px-3' : 'flex-1 gap-1'} ${item.disabled ? 'opacity-disabled' : ''}`}
              disabled={item.disabled}
              onPress={() => onValueChange(item.value)}
            >
              {selected ? (
                <AnimatedView
                  entering={FadeIn.duration(
                    primitives.motion.duration.fast,
                  ).reduceMotion(ReduceMotion.System)}
                  exiting={FadeOut.duration(
                    primitives.motion.duration.fast,
                  ).reduceMotion(ReduceMotion.System)}
                  pointerEvents="none"
                  style={{
                    backgroundColor: theme.interactionSubtle,
                    bottom: 0,
                    left: 0,
                    position: 'absolute',
                    right: 0,
                    top: 0,
                  }}
                />
              ) : null}
              <View className="z-10">
                <Icon
                  name={item.icon}
                  size="md"
                  tone={selected ? 'interaction' : 'muted'}
                />
                {item.unreadCount ? (
                  <View className="bg-danger absolute -top-2 -right-3 min-w-4 items-center rounded-full px-1">
                    <AppText variant="label" tone="inverse">
                      {item.unreadCount}
                    </AppText>
                  </View>
                ) : null}
              </View>
              <AppText
                className="z-10"
                variant="label"
                tone={selected ? 'interaction' : 'muted'}
              >
                {item.label}
              </AppText>
              {horizontal && item.unreadCount ? (
                <View className="bg-danger z-10 min-w-4 items-center rounded-full px-1">
                  <AppText variant="label" tone="inverse">
                    {item.unreadCount}
                  </AppText>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function StickyActionBar({ children }: { children: ReactNode }) {
  const layout = useResponsiveLayout();
  return (
    <View className="border-border bg-surface shadow-elevated dark:border-dark-border dark:bg-dark-surface border-t">
      <View
        className={`w-full flex-row items-center gap-3 ${layout.isCompact ? 'flex-wrap justify-end px-4 py-3' : 'justify-end py-3'}`}
        style={{
          alignSelf: 'center',
          maxWidth: layout.contentMaxWidth,
          paddingHorizontal: layout.pageGutter,
        }}
      >
        {children}
      </View>
    </View>
  );
}

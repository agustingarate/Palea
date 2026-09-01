import { Pressable, View } from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { create } from 'zustand';
import {
  createAnimatedComponent,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { primitives } from '@palea/design-tokens';
import { AppText, Button, Icon, IconButton } from '@palea/ui-native';
import { useLocale } from '@/core/localization/LocaleProvider';

const AnimatedView = createAnimatedComponent(View);

const useNavigationPreferences = create<{
  collapsed: boolean;
  toggle: () => void;
  collapse: () => void;
}>((set) => ({
  collapsed: false,
  toggle: () => set((state) => ({ collapsed: !state.collapsed })),
  collapse: () => set({ collapsed: true }),
}));

type DesktopNavigationLabels = {
  applications: string;
  metrics: string;
  resumes: string;
  profile: string;
  add: string;
  tracker: string;
  logout: string;
};

export function ProductDesktopNavigation({
  labels,
  onAdd,
  onPending,
  onSignOut,
  signingOut,
  active = 'applications',
  collapseWhen = false,
}: {
  labels: DesktopNavigationLabels;
  onAdd: () => void;
  onPending: (destination: 'resumes' | 'metrics' | 'profile') => void;
  onSignOut: () => void;
  signingOut: boolean;
  active?: 'applications' | 'resumes';
  /** Collapses the shared sidebar when a focused detail view needs more space. */
  collapseWhen?: boolean;
}) {
  const { collapsed, toggle, collapse } = useNavigationPreferences();
  const { t } = useLocale('applications');
  const router = useRouter();
  const sidebarWidth = useSharedValue(collapsed ? 76 : 224);
  const sidebarStyle = useAnimatedStyle(() => ({
    width: sidebarWidth.value,
  }));
  useEffect(() => {
    sidebarWidth.value = withTiming(collapsed ? 76 : 224, {
      duration: primitives.motion.duration.standard,
      reduceMotion: ReduceMotion.System,
    });
  }, [collapsed, sidebarWidth]);
  useEffect(() => {
    if (collapseWhen) collapse();
  }, [collapse, collapseWhen]);
  return (
    <AnimatedView style={[sidebarStyle, { overflow: 'hidden', zIndex: 2 }]}>
      <View className="h-full border-r border-border bg-surface px-3 py-5 dark:border-dark-border dark:bg-dark-surface">
        <View className="flex-row items-center justify-between gap-1">
          {!collapsed ? <AppText variant="sectionTitle">Palea</AppText> : null}
          <IconButton
            icon={collapsed ? 'chevronRight' : 'chevronLeft'}
            tone="interaction"
            accessibilityLabel={t(collapsed ? 'nav.expand' : 'nav.collapse')}
            onPress={toggle}
          />
        </View>
        {!collapsed ? (
          <View className="gap-1 px-1">
            <AppText variant="label" tone="muted">
              {labels.tracker}
            </AppText>
          </View>
        ) : null}
        <View className="mt-6">
          {collapsed ? (
            <DesktopNavItem
              collapsed
              label={labels.add}
              icon="filePlusCorner"
              onPress={onAdd}
            />
          ) : (
            <Button
              label={labels.add}
              leadingIcon="filePlusCorner"
              onPress={onAdd}
            />
          )}
        </View>
        <View className="mt-6 flex-1 gap-1">
          <DesktopNavItem
            label={labels.applications}
            icon="briefcase"
            selected={active === 'applications'}
            collapsed={collapsed}
            onPress={() => router.push('/')}
          />
          <DesktopNavItem
            label={labels.resumes}
            icon="fileText"
            selected={active === 'resumes'}
            collapsed={collapsed}
            onPress={() => router.push('/resumes')}
          />
          <DesktopNavItem
            label={labels.metrics}
            icon="barChart"
            collapsed={collapsed}
            onPress={() => onPending('metrics')}
          />
          <DesktopNavItem
            label={labels.profile}
            icon="user"
            collapsed={collapsed}
            onPress={() => onPending('profile')}
          />
        </View>
        {collapsed ? (
          <DesktopNavItem
            collapsed
            label={labels.logout}
            icon="logOut"
            onPress={onSignOut}
            disabled={signingOut}
          />
        ) : (
          <Button
            label={labels.logout}
            variant="secondary"
            loading={signingOut}
            onPress={onSignOut}
          />
        )}
      </View>
    </AnimatedView>
  );
}

function DesktopNavItem({
  label,
  icon,
  selected = false,
  onPress,
  collapsed = false,
  disabled = false,
}: {
  label: string;
  icon:
    | 'briefcase'
    | 'fileText'
    | 'barChart'
    | 'user'
    | 'filePlusCorner'
    | 'logOut';
  selected?: boolean;
  onPress: () => void;
  collapsed?: boolean;
  disabled?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      disabled={disabled}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onPress={onPress}
      className={`min-h-control-lg flex-row items-center gap-3 rounded-sm border px-3 ${focused ? 'border-focus-ring dark:border-dark-focus-ring' : 'border-transparent'} ${selected || hovered ? 'bg-primary-subtle dark:bg-dark-primary-subtle' : ''}`}
    >
      <Icon name={icon} tone={selected ? 'interaction' : 'muted'} />
      {!collapsed ? (
        <AppText
          variant="bodySmall"
          tone={selected ? 'interaction' : 'default'}
        >
          {label}
        </AppText>
      ) : null}
      {collapsed && (hovered || focused) ? (
        <View
          className="absolute left-16 rounded-sm border border-border bg-surface-elevated px-3 py-2 shadow-elevated dark:border-dark-border dark:bg-dark-surface-elevated"
          style={{ minWidth: 180 }}
        >
          <AppText variant="label">{label}</AppText>
        </View>
      ) : null}
    </Pressable>
  );
}

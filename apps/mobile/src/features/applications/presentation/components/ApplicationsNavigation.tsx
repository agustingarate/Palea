import { Pressable, View } from 'react-native';
import { AppText, Button, Icon } from '@palea/ui-native';

type DesktopNavigationLabels = {
  applications: string;
  metrics: string;
  resumes: string;
  profile: string;
  add: string;
  tracker: string;
  logout: string;
};

export function ApplicationsDesktopNavigation({
  labels,
  onAdd,
  onPending,
  onSignOut,
  signingOut,
}: {
  labels: DesktopNavigationLabels;
  onAdd: () => void;
  onPending: () => void;
  onSignOut: () => void;
  signingOut: boolean;
}) {
  return (
    <View
      className="border-r border-border bg-surface px-4 py-5 dark:border-dark-border dark:bg-dark-surface"
      style={{ width: 244 }}
    >
      <View className="gap-1">
        <AppText variant="sectionTitle">Palea</AppText>
        <AppText variant="label" tone="muted">
          {labels.tracker}
        </AppText>
      </View>
      <View className="mt-6">
        <Button label={`+ ${labels.add}`} onPress={onAdd} />
      </View>
      <View className="mt-6 flex-1 gap-1">
        <DesktopNavItem
          label={labels.applications}
          icon="briefcase"
          selected
          onPress={onPending}
        />
        <DesktopNavItem
          label={labels.resumes}
          icon="fileText"
          onPress={onPending}
        />
        <DesktopNavItem
          label={labels.metrics}
          icon="barChart"
          onPress={onPending}
        />
        <DesktopNavItem
          label={labels.profile}
          icon="user"
          onPress={onPending}
        />
      </View>
      <Button
        label={labels.logout}
        variant="secondary"
        loading={signingOut}
        onPress={onSignOut}
      />
    </View>
  );
}

function DesktopNavItem({
  label,
  icon,
  selected = false,
  onPress,
}: {
  label: string;
  icon: 'briefcase' | 'fileText' | 'barChart' | 'user';
  selected?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      className={`min-h-control-lg flex-row items-center gap-3 rounded-sm px-3 ${selected ? 'bg-primary-subtle dark:bg-dark-primary-subtle' : ''}`}
    >
      <Icon name={icon} tone={selected ? 'interaction' : 'muted'} />
      <AppText variant="bodySmall" tone={selected ? 'interaction' : 'default'}>
        {label}
      </AppText>
    </Pressable>
  );
}

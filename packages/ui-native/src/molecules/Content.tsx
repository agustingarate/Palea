import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { AppText } from '../atoms/AppText';
import { Button } from '../atoms/Button';
import { Icon, type IconName } from '../atoms/Icon';
import { Badge, type StatusTone } from '../atoms/VisualPrimitives';
import { Surface } from '../atoms/Surface';

export interface ResourceRowProps {
  title: string;
  subtitle?: string;
  icon?: IconName;
  actionIcon?: IconName;
  actionLabel?: string;
  onPress?: () => void;
}

export function ResourceRow({
  title,
  subtitle,
  icon = 'fileText',
  actionIcon = 'chevronRight',
  actionLabel,
  onPress,
}: ResourceRowProps) {
  const content = (
    <>
      <Icon name={icon} size="md" tone="muted" />
      <View className="flex-1">
        <AppText variant="bodySmall">{title}</AppText>
        {subtitle ? (
          <AppText variant="label" tone="muted">
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {onPress ? (
        <Icon
          name={actionIcon}
          size="md"
          tone="muted"
          accessibilityLabel={actionLabel}
        />
      ) : null}
    </>
  );
  if (!onPress)
    return (
      <View className="min-h-control-md bg-surface-subtle dark:bg-dark-surface-subtle flex-row items-center gap-3 rounded-sm px-3">
        {content}
      </View>
    );
  return (
    <Pressable
      accessibilityLabel={actionLabel ?? title}
      accessibilityRole="button"
      className="min-h-control-md bg-surface-subtle dark:bg-dark-surface-subtle flex-row items-center gap-3 rounded-sm px-3"
      onPress={onPress}
    >
      {content}
    </Pressable>
  );
}

export interface StatTileProps {
  label: string;
  value: string | number;
  trend?: string;
  tone?: StatusTone;
  icon?: IconName;
}

export function StatTile({
  label,
  value,
  trend,
  tone = 'neutral',
  icon = 'barChart',
}: StatTileProps) {
  return (
    <Surface className="min-w-32 flex-1 gap-2">
      <View className="flex-row items-center justify-between">
        <Icon
          name={icon}
          size="md"
          tone={tone === 'neutral' ? 'muted' : tone}
        />
        {trend ? <Badge label={trend} tone={tone} /> : null}
      </View>
      <AppText variant="sectionTitle">{value}</AppText>
      <AppText variant="label" tone="muted">
        {label}
      </AppText>
    </Surface>
  );
}

export interface FeedbackMessageProps {
  title: string;
  message: string;
  tone?: 'info' | 'success' | 'warning' | 'danger';
  actionLabel?: string;
  onAction?: () => void;
  icon?: IconName;
  children?: ReactNode;
}

/** Compact contextual information; unlike FeedbackMessage it does not interrupt a form. */
export function Notice({
  title,
  message,
  tone = 'info',
}: Pick<FeedbackMessageProps, 'title' | 'message' | 'tone'>) {
  return (
    <View
      accessibilityRole="summary"
      className="bg-surface-subtle dark:bg-dark-surface-subtle flex-row gap-3 rounded-sm px-3 py-3"
    >
      <Icon name={tone === 'danger' ? 'error' : 'info'} size="sm" tone={tone} />
      <View className="flex-1 gap-1">
        <AppText variant="label">{title}</AppText>
        <AppText variant="bodySmall" tone="muted">
          {message}
        </AppText>
      </View>
    </View>
  );
}

export function FeedbackMessage({
  title,
  message,
  tone = 'info',
  actionLabel,
  onAction,
  icon,
  children,
}: FeedbackMessageProps) {
  const resolvedIcon =
    icon ??
    (
      {
        info: 'info',
        success: 'checkCircle',
        warning: 'error',
        danger: 'error',
      } as const
    )[tone];
  return (
    <Surface
      accessibilityRole="summary"
      className="items-center gap-3"
      variant="subtle"
    >
      <Icon name={resolvedIcon} size="xl" tone={tone} />
      <AppText variant="sectionTitle" className="text-center">
        {title}
      </AppText>
      <AppText tone="muted" className="text-center">
        {message}
      </AppText>
      {children}
      {actionLabel && onAction ? (
        <Button
          label={actionLabel}
          onPress={onAction}
          variant={tone === 'danger' ? 'destructive' : 'primary'}
        />
      ) : null}
    </Surface>
  );
}

import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { createAnimatedComponent } from 'react-native-reanimated';
import { AppText } from '../atoms/AppText';
import { Button } from '../atoms/Button';
import { Icon, type IconName } from '../atoms/Icon';
import { Surface } from '../atoms/Surface';
import { Badge, Chip, type StatusTone } from '../atoms/VisualPrimitives';
import { ProgressIndicator } from '../molecules/Selection';
import { usePressFeedback } from '../internal/usePressFeedback';
import { useResponsiveLayout } from '../internal/useResponsiveLayout';

const AnimatedView = createAnimatedComponent(View);

export interface ApplicationCardProps {
  title: string;
  company: string;
  status: string;
  statusTone?: StatusTone;
  metadata?: readonly string[];
  tags?: readonly string[];
  variant?: 'board' | 'list';
  selected?: boolean;
  disabled?: boolean;
  onPress?: () => void;
}

export function ApplicationCard({
  title,
  company,
  status,
  statusTone = 'interaction',
  metadata = [],
  tags = [],
  variant = 'board',
  selected = false,
  disabled = false,
  onPress,
}: ApplicationCardProps) {
  const layout = useResponsiveLayout();
  const press = usePressFeedback('control');
  const compactList = variant === 'list' && !layout.isCompact;
  return (
    <AnimatedView style={press.animatedStyle}>
      <Pressable
        accessibilityLabel={`${title}, ${company}, ${status}`}
        accessibilityRole={onPress ? 'button' : undefined}
        accessibilityState={{ selected, disabled }}
        className={disabled ? 'opacity-disabled' : ''}
        disabled={!onPress || disabled}
        onPressIn={onPress ? press.onPressIn : undefined}
        onPressOut={onPress ? press.onPressOut : undefined}
        onPress={onPress}
      >
        <Surface
          variant={selected ? 'selected' : 'default'}
          className={`gap-3 ${compactList ? 'flex-row items-center' : ''}`}
        >
          <View className="flex-1 gap-1">
            <AppText variant="body" className="font-inter-semibold">
              {title}
            </AppText>
            <AppText variant="bodySmall" tone="muted">
              {company}
            </AppText>
            {metadata.length ? (
              <View className="flex-row flex-wrap gap-2">
                {metadata.map((item) => (
                  <AppText key={item} variant="label" tone="muted">
                    {item}
                  </AppText>
                ))}
              </View>
            ) : null}
          </View>
          <Badge label={status} tone={statusTone} />
          {variant === 'board' && tags.length ? (
            <View className="flex-row flex-wrap gap-2">
              {tags.map((tag) => (
                <Chip key={tag} label={tag} />
              ))}
            </View>
          ) : null}
          {onPress && compactList ? (
            <Icon name="chevronRight" size="md" tone="muted" />
          ) : null}
        </Surface>
      </Pressable>
    </AnimatedView>
  );
}

export interface DetailCardProps {
  title: string;
  icon?: IconName;
  action?: ReactNode;
  children: ReactNode;
}

export function DetailCard({ title, icon, action, children }: DetailCardProps) {
  return (
    <Surface className="gap-3">
      <View className="flex-row items-center gap-2">
        {icon ? <Icon name={icon} size="md" tone="muted" /> : null}
        <AppText variant="sectionTitle" className="flex-1">
          {title}
        </AppText>
        {action}
      </View>
      {children}
    </Surface>
  );
}

export interface CVCardProps {
  name: string;
  fileName: string;
  updatedLabel: string;
  primary?: boolean;
  score?: number;
  onOpen?: () => void;
  onDownload?: () => void;
}

export function CVCard({
  name,
  fileName,
  updatedLabel,
  primary = false,
  score,
  onOpen,
  onDownload,
}: CVCardProps) {
  const layout = useResponsiveLayout();
  return (
    <Surface className="gap-3">
      <View className="flex-row items-start gap-3">
        <View className="bg-primary-subtle dark:bg-dark-primary-subtle h-12 w-12 items-center justify-center rounded-sm">
          <Icon name="fileText" tone="interaction" />
        </View>
        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <AppText className="font-inter-semibold flex-1">{name}</AppText>
            {primary ? <Badge label="Primary" tone="interaction" /> : null}
          </View>
          <AppText variant="bodySmall" tone="muted">
            {fileName}
          </AppText>
          <AppText variant="label" tone="muted">
            {updatedLabel}
          </AppText>
        </View>
      </View>
      {typeof score === 'number' ? (
        <ProgressIndicator
          current={score}
          total={100}
          label={`${score}% match`}
        />
      ) : null}
      {onOpen || onDownload ? (
        <View
          className={layout.isCompact ? 'gap-2' : 'flex-row items-center gap-2'}
        >
          {onOpen ? (
            <Button
              label="Open"
              variant="secondary"
              onPress={onOpen}
              className="flex-1"
            />
          ) : null}
          {onDownload ? (
            <Button
              label="Download"
              leadingIcon="download"
              variant="ghost"
              onPress={onDownload}
              className="flex-1"
            />
          ) : null}
        </View>
      ) : null}
    </Surface>
  );
}

import { Children, type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
  type ViewProps,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { AppText } from '../atoms/AppText';
import { Divider } from '../atoms/VisualPrimitives';
import { useResponsiveLayout } from '../internal/useResponsiveLayout';

export interface ScreenProps extends ViewProps {
  children: ReactNode;
  edges?: readonly Edge[];
  className?: string;
}

export function Screen({
  children,
  edges = ['top', 'bottom'],
  className = '',
  ...props
}: ScreenProps) {
  return (
    <SafeAreaView
      edges={edges}
      className={`bg-background dark:bg-dark-background flex-1 ${className}`}
      {...props}
    >
      {children}
    </SafeAreaView>
  );
}

export interface ScrollScreenProps extends ScreenProps {
  contentClassName?: string;
  keyboardAware?: boolean;
}

export function ScrollScreen({
  children,
  contentClassName = '',
  keyboardAware = false,
  ...props
}: ScrollScreenProps) {
  const layout = useResponsiveLayout();
  const content = (
    <ScrollView
      contentContainerStyle={{
        paddingHorizontal: layout.pageGutter,
        paddingVertical: layout.isExpanded ? 40 : 24,
      }}
      keyboardShouldPersistTaps="handled"
    >
      <View
        className={`w-full gap-6 ${contentClassName}`}
        style={{ alignSelf: 'center', maxWidth: layout.contentMaxWidth }}
      >
        {children}
      </View>
    </ScrollView>
  );
  return (
    <Screen {...props}>
      {keyboardAware ? (
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {content}
        </KeyboardAvoidingView>
      ) : (
        content
      )}
    </Screen>
  );
}

export interface FocusedFormLayoutProps extends ScrollScreenProps {
  title: string;
  description?: string;
  progress?: ReactNode;
  footer?: ReactNode;
}

export function FocusedFormLayout({
  title,
  description,
  progress,
  footer,
  children,
  ...props
}: FocusedFormLayoutProps) {
  const layout = useResponsiveLayout();
  return (
    <Screen {...props}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: layout.pageGutter,
            paddingVertical: layout.isExpanded ? 40 : 24,
          }}
          keyboardShouldPersistTaps="handled"
        >
          <View
            className="w-full gap-6"
            style={{ alignSelf: 'center', maxWidth: layout.formMaxWidth }}
          >
            <View className="gap-2">
              <AppText variant="screenTitle">{title}</AppText>
              {description ? (
                <AppText tone="muted">{description}</AppText>
              ) : null}
              {progress}
            </View>
            {children}
          </View>
        </ScrollView>
        {footer}
      </KeyboardAvoidingView>
    </Screen>
  );
}

export interface ResponsiveGridProps extends ViewProps {
  children: ReactNode;
  columns?: Partial<Record<'compact' | 'medium' | 'expanded', 1 | 2 | 3>>;
  gap?: number;
}

/** A universal grid: one column on phones, then fluid equal columns on web/tablet. */
export function ResponsiveGrid({
  children,
  columns,
  gap = 16,
  style,
  ...props
}: ResponsiveGridProps) {
  const layout = useResponsiveLayout();
  const columnCount =
    columns?.[layout.breakpoint] ??
    (layout.breakpoint === 'expanded'
      ? (columns?.expanded ?? layout.gridColumns)
      : layout.breakpoint === 'medium'
        ? (columns?.medium ?? layout.gridColumns)
        : (columns?.compact ?? 1));

  return (
    <View
      style={[
        { flexDirection: 'row', flexWrap: 'wrap', margin: -gap / 2 },
        style,
      ]}
      {...props}
    >
      {Children.toArray(children).map((child, index) => (
        <View
          key={index}
          style={{
            padding: gap / 2,
            width: `${100 / columnCount}%`,
          }}
        >
          {child}
        </View>
      ))}
    </View>
  );
}

export function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <View className="gap-4">
      <View className="gap-1">
        <AppText variant="sectionTitle">{title}</AppText>
        {description ? (
          <AppText variant="bodySmall" tone="muted">
            {description}
          </AppText>
        ) : null}
      </View>
      <Divider />
      {children}
    </View>
  );
}

import type { PropsWithChildren } from 'react';
import { View, type ViewProps } from 'react-native';

export type SurfaceVariant = 'default' | 'subtle' | 'elevated' | 'selected';
export type SurfacePadding = 'none' | 'sm' | 'md' | 'lg';

export interface SurfaceProps extends ViewProps {
  variant?: SurfaceVariant;
  padding?: SurfacePadding;
  className?: string;
}

const variants: Record<SurfaceVariant, string> = {
  default:
    'border-border bg-surface dark:border-dark-border dark:bg-dark-surface',
  subtle: 'border-transparent bg-surface-subtle dark:bg-dark-surface-subtle',
  elevated:
    'border-border bg-surface-elevated shadow-elevated dark:border-dark-border dark:bg-dark-surface-elevated',
  selected:
    'border-interaction bg-interaction-subtle dark:border-dark-interaction dark:bg-dark-interaction-subtle',
};

const paddings: Record<SurfacePadding, string> = {
  none: '',
  sm: 'p-2',
  md: 'p-4',
  lg: 'p-6',
};

export function Surface({
  children,
  variant = 'default',
  padding = 'md',
  className = '',
  ...props
}: PropsWithChildren<SurfaceProps>) {
  return (
    <View
      className={`rounded-md border ${variants[variant]} ${paddings[padding]} ${className}`}
      {...props}
    >
      {children}
    </View>
  );
}

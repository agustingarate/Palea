import type { PropsWithChildren } from 'react';
import { View, type ViewProps } from 'react-native';

export interface SurfaceProps extends ViewProps {
  className?: string;
}

export function Surface({
  children,
  className = '',
  ...props
}: PropsWithChildren<SurfaceProps>) {
  return (
    <View
      className={`border-border bg-surface dark:border-dark-border dark:bg-dark-surface rounded-md border p-4 ${className}`}
      {...props}
    >
      {children}
    </View>
  );
}

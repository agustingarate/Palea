import type { PropsWithChildren } from 'react';
import { Text, type TextProps } from 'react-native';

export type TextVariant =
  'display' | 'screenTitle' | 'sectionTitle' | 'body' | 'bodySmall' | 'label';

export type TextTone =
  | 'default'
  | 'muted'
  | 'inverse'
  | 'interaction'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info';

const variants: Record<TextVariant, string> = {
  display: 'font-bold text-display',
  screenTitle: 'font-bold text-screen-title',
  sectionTitle: 'font-semibold text-section-title',
  body: 'font-sans text-body',
  bodySmall: 'font-sans text-body-small',
  label: 'font-medium text-label',
};

const tones: Record<TextTone, string> = {
  default: 'text-text dark:text-dark-text',
  muted: 'text-text-muted dark:text-dark-text-muted',
  inverse: 'text-text-inverse dark:text-dark-text-inverse',
  interaction: 'text-interaction dark:text-dark-interaction',
  success: 'text-success dark:text-dark-success',
  warning: 'text-warning dark:text-dark-warning',
  danger: 'text-danger dark:text-dark-danger',
  info: 'text-info dark:text-dark-info',
};

export interface AppTextProps extends TextProps {
  variant?: TextVariant;
  tone?: TextTone;
  className?: string;
}

export function AppText({
  children,
  variant = 'body',
  tone = 'default',
  className = '',
  ...props
}: PropsWithChildren<AppTextProps>) {
  return (
    <Text
      className={`${variants[variant]} ${tones[tone]} ${className}`}
      {...props}
    >
      {children}
    </Text>
  );
}

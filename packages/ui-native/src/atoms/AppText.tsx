import type { PropsWithChildren } from 'react';
import { Text, type TextProps } from 'react-native';

type TextVariant = 'headline' | 'title' | 'body' | 'caption';

const variants: Record<TextVariant, string> = {
  headline: 'font-bold text-2xl leading-8',
  title: 'font-semibold text-xl leading-7',
  body: 'text-base leading-6',
  caption: 'text-xs font-medium leading-4',
};

export interface AppTextProps extends TextProps {
  variant?: TextVariant;
  muted?: boolean;
  className?: string;
}

export function AppText({
  children,
  variant = 'body',
  muted = false,
  className = '',
  ...props
}: PropsWithChildren<AppTextProps>) {
  return (
    <Text
      className={`${variants[variant]} ${muted ? 'text-text-muted dark:text-dark-text-muted' : 'text-text dark:text-dark-text'} ${className}`}
      {...props}
    >
      {children}
    </Text>
  );
}

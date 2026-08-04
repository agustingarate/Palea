import { Pressable, type PressableProps } from 'react-native';
import { AppText } from './AppText';

export interface ButtonProps extends PressableProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'ghost';
}

const variants = {
  primary: 'bg-primary dark:bg-dark-primary',
  secondary:
    'border border-border bg-surface dark:border-dark-border dark:bg-dark-surface',
  ghost: 'bg-transparent',
};

export function Button({
  label,
  variant = 'primary',
  disabled,
  ...props
}: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      className={`min-h-12 items-center justify-center rounded-md px-4 ${variants[variant]} ${disabled ? 'opacity-50' : ''}`}
      disabled={disabled}
      {...props}
    >
      <AppText
        className={
          variant === 'primary'
            ? 'text-on-primary dark:text-dark-on-primary'
            : ''
        }
      >
        {label}
      </AppText>
    </Pressable>
  );
}

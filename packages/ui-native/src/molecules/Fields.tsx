import { forwardRef, useState, type ReactNode } from 'react';
import { Pressable, TextInput, type TextInputProps, View } from 'react-native';
import { AppText } from '../atoms/AppText';
import { Icon, type IconName } from '../atoms/Icon';
import { IconButton } from '../atoms/VisualPrimitives';
import { useThemeColors } from '../internal/useThemeColors';

export interface TextFieldProps extends Omit<TextInputProps, 'editable'> {
  label: string;
  helperText?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  leading?: ReactNode;
  trailing?: ReactNode;
  containerClassName?: string;
}

export const TextField = forwardRef<TextInput, TextFieldProps>(
  function TextField(
    {
      label,
      helperText,
      error,
      required = false,
      disabled = false,
      readOnly = false,
      leading,
      trailing,
      containerClassName = '',
      className = '',
      onFocus,
      onBlur,
      accessibilityHint,
      ...props
    },
    ref,
  ) {
    const [focused, setFocused] = useState(false);
    const theme = useThemeColors();
    const blocked = disabled || readOnly;
    const border = error
      ? 'border-danger dark:border-dark-danger'
      : focused
        ? 'border-focus-ring dark:border-dark-focus-ring'
        : 'border-border dark:border-dark-border';

    return (
      <View className={`gap-1 ${containerClassName}`}>
        <View className="flex-row items-center gap-1">
          <AppText variant="label" tone={error ? 'danger' : 'default'}>
            {label}
          </AppText>
          {required ? (
            <AppText variant="label" tone="danger">
              *
            </AppText>
          ) : null}
        </View>
        <View
          className={`min-h-control-md bg-surface dark:bg-dark-surface flex-row items-center gap-2 rounded-sm border px-3 ${border} ${blocked ? 'bg-disabled-surface opacity-disabled dark:bg-dark-disabled-surface' : ''}`}
        >
          {leading}
          <TextInput
            ref={ref}
            accessibilityHint={error ?? helperText ?? accessibilityHint}
            accessibilityLabel={label}
            accessibilityState={{ disabled: blocked }}
            className={`min-h-control-md font-inter-regular text-body text-text dark:text-dark-text flex-1 ${className}`}
            editable={!blocked}
            onBlur={(event) => {
              setFocused(false);
              onBlur?.(event);
            }}
            onFocus={(event) => {
              setFocused(true);
              onFocus?.(event);
            }}
            placeholderTextColor={theme.textMuted}
            {...props}
          />
          {trailing}
        </View>
        {error ? (
          <AppText
            accessibilityLiveRegion="polite"
            variant="label"
            tone="danger"
          >
            {error}
          </AppText>
        ) : helperText ? (
          <AppText variant="label" tone="muted">
            {helperText}
          </AppText>
        ) : null}
      </View>
    );
  },
);

export interface PasswordFieldProps extends Omit<
  TextFieldProps,
  'secureTextEntry' | 'trailing'
> {
  showPasswordLabel?: string;
  hidePasswordLabel?: string;
}

export const PasswordField = forwardRef<TextInput, PasswordFieldProps>(
  function PasswordField(
    {
      showPasswordLabel = 'Show password',
      hidePasswordLabel = 'Hide password',
      ...props
    },
    ref,
  ) {
    const [visible, setVisible] = useState(false);
    return (
      <TextField
        ref={ref}
        autoCapitalize="none"
        secureTextEntry={!visible}
        trailing={
          <IconButton
            accessibilityLabel={visible ? hidePasswordLabel : showPasswordLabel}
            icon={visible ? 'eyeOff' : 'eye'}
            iconSize="sm"
            onPress={() => setVisible((value) => !value)}
          />
        }
        {...props}
      />
    );
  },
);

export const SearchField = forwardRef<
  TextInput,
  Omit<TextFieldProps, 'leading'>
>(function SearchField(props, ref) {
  return (
    <TextField
      ref={ref}
      returnKeyType="search"
      leading={<Icon name="search" size="sm" tone="muted" />}
      {...props}
    />
  );
});

export const TextAreaField = forwardRef<TextInput, TextFieldProps>(
  function TextAreaField(props, ref) {
    return (
      <TextField
        ref={ref}
        multiline
        numberOfLines={5}
        textAlignVertical="top"
        className="min-h-28 py-3"
        {...props}
      />
    );
  },
);

interface TriggerFieldProps {
  label: string;
  value?: string;
  placeholder: string;
  icon: IconName;
  trailingIcon?: IconName;
  helperText?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
}

function TriggerField({
  label,
  value,
  placeholder,
  icon,
  trailingIcon = 'chevronDown',
  helperText,
  error,
  required = false,
  disabled = false,
  onPress,
  accessibilityLabel,
}: TriggerFieldProps) {
  return (
    <View className="gap-1">
      <View className="flex-row items-center gap-1">
        <AppText variant="label" tone={error ? 'danger' : 'default'}>
          {label}
        </AppText>
        {required ? (
          <AppText variant="label" tone="danger">
            *
          </AppText>
        ) : null}
      </View>
      <Pressable
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        className={`min-h-control-md bg-surface dark:bg-dark-surface flex-row items-center gap-2 rounded-sm border px-3 ${error ? 'border-danger dark:border-dark-danger' : 'border-border dark:border-dark-border'} ${disabled ? 'opacity-disabled' : ''}`}
        disabled={disabled}
        onPress={onPress}
      >
        <Icon name={icon} size="sm" tone="muted" />
        <AppText className="flex-1" tone={value ? 'default' : 'muted'}>
          {value ?? placeholder}
        </AppText>
        <Icon name={trailingIcon} size="sm" tone="muted" />
      </Pressable>
      {error ? (
        <AppText accessibilityLiveRegion="polite" variant="label" tone="danger">
          {error}
        </AppText>
      ) : helperText ? (
        <AppText variant="label" tone="muted">
          {helperText}
        </AppText>
      ) : null}
    </View>
  );
}

export type SelectTriggerProps = Omit<TriggerFieldProps, 'icon'>;
export function SelectTrigger(props: SelectTriggerProps) {
  return <TriggerField icon="list" {...props} />;
}

export type DateTriggerProps = Omit<TriggerFieldProps, 'icon' | 'trailingIcon'>;
export function DateTrigger(props: DateTriggerProps) {
  return <TriggerField icon="calendar" trailingIcon="calendar" {...props} />;
}

export type FileTriggerProps = Omit<TriggerFieldProps, 'icon' | 'trailingIcon'>;
export function FileTrigger(props: FileTriggerProps) {
  return <TriggerField icon="file" trailingIcon="upload" {...props} />;
}

export interface FileUploadFieldProps {
  label?: string;
  idleActionLabel?: string;
  loadingLabel?: string;
  acceptedTypes: string;
  maxSizeLabel: string;
  fileName?: string;
  progress?: number;
  isLoading?: boolean;
  disabled?: boolean;
  error?: string;
  onPress: () => void;
}

/** A reusable file selector. The host owns the picker and upload transport. */
export function FileUploadField({
  label,
  idleActionLabel = 'Seleccioná un archivo',
  loadingLabel = 'Cargando archivo…',
  acceptedTypes,
  maxSizeLabel,
  fileName,
  progress,
  isLoading = false,
  disabled = false,
  error,
  onPress,
}: FileUploadFieldProps) {
  const safeProgress = Math.min(Math.max(progress ?? 0, 0), 100);
  const blocked = disabled || isLoading;
  return (
    <View className="gap-2">
      {label ? <AppText variant="label">{label}</AppText> : null}
      <Pressable
        accessibilityHint={`${acceptedTypes}. Tamaño máximo: ${maxSizeLabel}.`}
        accessibilityLabel={label ?? idleActionLabel}
        accessibilityRole="button"
        accessibilityState={{ busy: isLoading, disabled: blocked }}
        className={`min-h-36 border-border bg-surface dark:border-dark-border dark:bg-dark-surface items-center justify-center gap-2 rounded-md border border-dashed px-6 py-5 ${error ? 'border-danger dark:border-dark-danger' : ''} ${blocked ? 'opacity-disabled' : ''}`}
        disabled={blocked}
        onPress={onPress}
      >
        <View className="bg-surface-subtle dark:bg-dark-surface-subtle h-12 w-12 items-center justify-center rounded-full">
          <Icon name={isLoading ? 'upload' : 'fileText'} size="md" tone="interaction" />
        </View>
        <AppText variant="label" tone="interaction">
          {isLoading ? loadingLabel : fileName ?? idleActionLabel}
        </AppText>
        <AppText variant="label" tone="muted">
          {isLoading ? `Progreso: ${safeProgress}%` : `${acceptedTypes} · Máx. ${maxSizeLabel}`}
        </AppText>
        {isLoading ? (
          <View accessibilityLabel={`Progreso de carga: ${safeProgress}%`} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: safeProgress }} className="bg-surface-subtle dark:bg-dark-surface-subtle h-2 w-full overflow-hidden rounded-full">
            <View className="bg-interaction dark:bg-dark-interaction h-full rounded-full" style={{ width: `${safeProgress}%` }} />
          </View>
        ) : null}
      </Pressable>
      {error ? <AppText accessibilityLiveRegion="polite" variant="label" tone="danger">{error}</AppText> : null}
    </View>
  );
}
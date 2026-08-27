import { forwardRef, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  TextInput,
  type TextInputProps,
  View,
} from 'react-native';
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

export interface SelectOption<Value extends string = string> {
  value: Value;
  label: string;
  selectedLabel?: string;
  description?: string;
  keywords?: readonly string[];
  disabled?: boolean;
}

export interface SearchableSelectProps<Value extends string = string> {
  label: string;
  value?: Value;
  options: readonly SelectOption<Value>[];
  placeholder: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  required?: boolean;
  disabled?: boolean;
  loading?: boolean;
  error?: string;
  searchable?: boolean;
  /** Sizes the trigger to its selected value instead of filling the available row. */
  compact?: boolean;
  leadingIcon?: IconName;
  renderLeading?: (option: SelectOption<Value>) => ReactNode;
  onValueChange(value: Value): void;
}

function normalizeSearch(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase();
}

/**
 * Controlled, platform-adaptive option picker. It deliberately accepts all copy
 * from the consumer so ui-native remains free of product translations.
 */
export function SearchableSelect<Value extends string = string>({
  label,
  value,
  options,
  placeholder,
  searchPlaceholder = 'Buscar',
  emptyMessage = 'No hay opciones disponibles.',
  required = false,
  disabled = false,
  loading = false,
  error,
  searchable = true,
  compact = false,
  leadingIcon,
  renderLeading,
  onValueChange,
}: SearchableSelectProps<Value>) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const trigger = useRef<View>(null);
  const selected = options.find((option) => option.value === value);
  const filtered = useMemo(() => {
    const normalizedQuery = normalizeSearch(query.trim());
    if (!normalizedQuery) return options;
    return options.filter((option) =>
      [
        option.label,
        option.description,
        option.value,
        ...(option.keywords ?? []),
      ]
        .filter(Boolean)
        .some((candidate) =>
          normalizeSearch(candidate!).includes(normalizedQuery),
        ),
    );
  }, [options, query]);
  const close = () => {
    setOpen(false);
    setQuery('');
    trigger.current?.focus?.();
  };
  const choose = (option: SelectOption<Value>) => {
    if (option.disabled) return;
    onValueChange(option.value);
    close();
  };
  const border = error
    ? 'border-danger dark:border-dark-danger'
    : 'border-border dark:border-dark-border';

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
        ref={trigger}
        accessibilityLabel={label}
        accessibilityRole="combobox"
        accessibilityState={{ disabled, expanded: open, busy: loading }}
        accessibilityHint={error}
        className={`min-h-control-md bg-surface dark:bg-dark-surface flex-row items-center gap-2 rounded-sm border px-3 ${compact ? 'self-start' : ''} ${border} ${disabled ? 'opacity-disabled' : ''}`}
        disabled={disabled}
        onPress={() => setOpen(true)}
      >
        {selected && renderLeading ? (
          renderLeading(selected)
        ) : leadingIcon ? (
          <Icon name={leadingIcon} size="sm" tone="muted" />
        ) : null}
        <AppText
          className={compact ? undefined : 'flex-1'}
          numberOfLines={compact ? 1 : undefined}
          tone={selected ? 'default' : 'muted'}
        >
          {selected?.selectedLabel ?? selected?.label ?? placeholder}
        </AppText>
        <Icon name="chevronDown" size="sm" tone="muted" />
      </Pressable>
      {error ? (
        <AppText accessibilityLiveRegion="polite" variant="label" tone="danger">
          {error}
        </AppText>
      ) : null}
      <Modal
        transparent
        animationType="fade"
        visible={open}
        onRequestClose={close}
      >
        <Pressable className="bg-overlay flex-1 justify-end" onPress={close}>
          <Pressable
            accessibilityViewIsModal
            className="bg-surface dark:bg-dark-surface max-h-[80%] gap-3 rounded-t-lg px-4 pt-5 pb-8"
            onPress={() => undefined}
          >
            <View className="flex-row items-center justify-between gap-3">
              <AppText variant="sectionTitle">{label}</AppText>
              <IconButton
                accessibilityLabel="Cerrar"
                icon="close"
                iconSize="sm"
                onPress={close}
              />
            </View>
            {searchable ? (
              <SearchField
                label={searchPlaceholder}
                placeholder={searchPlaceholder}
                value={query}
                onChangeText={setQuery}
                autoFocus
              />
            ) : null}
            {loading ? (
              <AppText accessibilityLiveRegion="polite" tone="muted">
                {emptyMessage}
              </AppText>
            ) : filtered.length === 0 ? (
              <AppText accessibilityLiveRegion="polite" tone="muted">
                {emptyMessage}
              </AppText>
            ) : (
              <FlatList
                data={filtered}
                keyExtractor={(option) => option.value}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item, index }) => {
                  const isSelected = item.value === value;
                  return (
                    <Pressable
                      accessibilityRole="radio"
                      accessibilityState={{
                        selected: isSelected,
                        disabled: item.disabled,
                      }}
                      accessibilityValue={{
                        text: `${index + 1} de ${filtered.length}`,
                      }}
                      className={`min-h-12 flex-row items-center gap-3 rounded-sm px-3 py-2 ${isSelected ? 'bg-accent-subtle dark:bg-dark-accent-subtle' : ''} ${item.disabled ? 'opacity-disabled' : ''}`}
                      disabled={item.disabled}
                      onPress={() => choose(item)}
                    >
                      {renderLeading ? renderLeading(item) : null}
                      <View className="flex-1">
                        <AppText>{item.label}</AppText>
                        {item.description ? (
                          <AppText variant="label" tone="muted">
                            {item.description}
                          </AppText>
                        ) : null}
                      </View>
                      {isSelected ? (
                        <Icon name="check" size="sm" tone="interaction" />
                      ) : null}
                    </Pressable>
                  );
                }}
              />
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
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
        className={`border-border bg-surface dark:border-dark-border dark:bg-dark-surface min-h-36 items-center justify-center gap-2 rounded-md border border-dashed px-6 py-5 ${error ? 'border-danger dark:border-dark-danger' : ''} ${blocked ? 'opacity-disabled' : ''}`}
        disabled={blocked}
        onPress={onPress}
      >
        <View className="bg-surface-subtle dark:bg-dark-surface-subtle h-12 w-12 items-center justify-center rounded-full">
          <Icon
            name={isLoading ? 'upload' : 'fileText'}
            size="md"
            tone="interaction"
          />
        </View>
        <AppText variant="label" tone="interaction">
          {isLoading ? loadingLabel : (fileName ?? idleActionLabel)}
        </AppText>
        <AppText variant="label" tone="muted">
          {isLoading
            ? `Progreso: ${safeProgress}%`
            : `${acceptedTypes} · Máx. ${maxSizeLabel}`}
        </AppText>
        {isLoading ? (
          <View
            accessibilityLabel={`Progreso de carga: ${safeProgress}%`}
            accessibilityRole="progressbar"
            accessibilityValue={{ min: 0, max: 100, now: safeProgress }}
            className="bg-surface-subtle dark:bg-dark-surface-subtle h-2 w-full overflow-hidden rounded-full"
          >
            <View
              className="bg-interaction dark:bg-dark-interaction h-full rounded-full"
              style={{ width: `${safeProgress}%` }}
            />
          </View>
        ) : null}
      </Pressable>
      {error ? (
        <AppText accessibilityLiveRegion="polite" variant="label" tone="danger">
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

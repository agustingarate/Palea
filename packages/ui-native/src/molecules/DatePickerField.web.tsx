import { createElement } from 'react';
import { View } from 'react-native';
import { AppText } from '../atoms/AppText';
import { Button } from '../atoms/Button';
import { useThemeColors } from '../internal/useThemeColors';
import {
  todayDateValue,
  type DatePickerFieldProps,
} from './DatePickerField.types';

export type { DatePickerFieldProps } from './DatePickerField.types';

export function DatePickerField({
  label,
  value,
  minimum,
  maximum,
  error,
  helperText,
  disabled,
  clearLabel,
  todayLabel,
  onChange,
}: DatePickerFieldProps) {
  const theme = useThemeColors();
  return (
    <View className="gap-2">
      <View className="gap-1">
        <AppText variant="label" tone={error ? 'danger' : 'default'}>
          {label}
        </AppText>
        <View className="flex-row flex-wrap items-center gap-2">
          {createElement('input', {
            'aria-describedby': error ? `${label}-error` : undefined,
            'aria-invalid': Boolean(error),
            'aria-label': label,
            disabled,
            max: maximum,
            min: minimum,
            type: 'date',
            value: value ?? '',
            onChange: (event: { currentTarget: { value: string } }) =>
              onChange(event.currentTarget.value || null),
            style: {
              background: theme.surface,
              border: `1px solid ${error ? theme.danger : theme.border}`,
              borderRadius: 6,
              boxSizing: 'border-box',
              color: 'inherit',
              font: 'inherit',
              minHeight: 44,
              padding: '8px 12px',
              minWidth: 176,
              width: 'auto',
            },
          })}
          {todayLabel ? (
            <Button
              label={todayLabel}
              size="sm"
              variant="secondary"
              disabled={disabled}
              onPress={() => onChange(todayDateValue(maximum))}
            />
          ) : null}
          {value ? (
            <Button
              label={clearLabel}
              size="sm"
              variant="secondary"
              disabled={disabled}
              onPress={() => onChange(null)}
            />
          ) : null}
        </View>
        {error ? (
          <AppText nativeID={`${label}-error`} variant="label" tone="danger">
            {error}
          </AppText>
        ) : helperText ? (
          <AppText variant="label" tone="muted">
            {helperText}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}

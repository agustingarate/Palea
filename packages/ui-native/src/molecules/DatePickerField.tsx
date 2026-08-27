import { lazy, Suspense, useState } from 'react';
import { Modal, Platform, Pressable, View } from 'react-native';
import type { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { AppText } from '../atoms/AppText';
import { Button } from '../atoms/Button';
import { DateTrigger } from './Fields';
import {
  dateFromLocalIso,
  localIsoFromDate,
  type DatePickerFieldProps,
} from './DatePickerField.types';
import { DatePickerField as WebDatePickerField } from './DatePickerField.web';

export type { DatePickerFieldProps } from './DatePickerField.types';

const NativeDateTimePicker = lazy(() =>
  import('@react-native-community/datetimepicker').then((module) => ({
    default: module.default,
  })),
);

export function DatePickerField({
  label,
  value,
  placeholder,
  minimum,
  maximum,
  error,
  helperText,
  disabled,
  clearLabel,
  todayLabel,
  cancelLabel,
  confirmLabel,
  onChange,
}: DatePickerFieldProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(() =>
    value ? dateFromLocalIso(value) : new Date(),
  );
  const show = () => {
    setDraft(value ? dateFromLocalIso(value) : new Date());
    setOpen(true);
  };
  const onNativeChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') {
      setOpen(false);
      if (event.type === 'set' && selected)
        onChange(localIsoFromDate(selected));
      return;
    }
    if (selected) setDraft(selected);
  };
  if (Platform.OS === 'web')
    return (
      <WebDatePickerField
        label={label}
        value={value}
        placeholder={placeholder}
        minimum={minimum}
        maximum={maximum}
        error={error}
        helperText={helperText}
        disabled={disabled}
        clearLabel={clearLabel}
        todayLabel={todayLabel}
        cancelLabel={cancelLabel}
        confirmLabel={confirmLabel}
        onChange={onChange}
      />
    );

  return (
    <View className="gap-2">
      <DateTrigger
        label={label}
        value={value ?? undefined}
        placeholder={placeholder}
        helperText={helperText}
        error={error}
        disabled={disabled}
        onPress={show}
      />
      <View className="flex-row items-center gap-3">
        {todayLabel && maximum ? (
          <Button
            label={todayLabel}
            size="sm"
            variant="secondary"
            disabled={disabled}
            onPress={() => onChange(maximum)}
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
      {open && Platform.OS === 'android' ? (
        <Suspense fallback={null}>
          <NativeDateTimePicker
            value={draft}
            mode="date"
            minimumDate={minimum ? dateFromLocalIso(minimum) : undefined}
            maximumDate={maximum ? dateFromLocalIso(maximum) : undefined}
            onChange={onNativeChange}
          />
        </Suspense>
      ) : null}
      {Platform.OS === 'ios' ? (
        <Modal
          transparent
          animationType="fade"
          visible={open}
          onRequestClose={() => setOpen(false)}
        >
          <Pressable
            className="bg-overlay flex-1 items-center justify-center px-6"
            onPress={() => setOpen(false)}
          >
            <Pressable
              accessibilityViewIsModal
              className="bg-surface dark:bg-dark-surface w-full max-w-md gap-4 rounded-lg p-5"
              onPress={() => undefined}
            >
              <AppText variant="sectionTitle">{label}</AppText>
              <Suspense fallback={null}>
                <NativeDateTimePicker
                  value={draft}
                  mode="date"
                  display="inline"
                  minimumDate={minimum ? dateFromLocalIso(minimum) : undefined}
                  maximumDate={maximum ? dateFromLocalIso(maximum) : undefined}
                  onChange={onNativeChange}
                />
              </Suspense>
              <View className="flex-row justify-end gap-2">
                <Button
                  label={cancelLabel}
                  variant="ghost"
                  onPress={() => setOpen(false)}
                />
                <Button
                  label={confirmLabel}
                  onPress={() => {
                    onChange(localIsoFromDate(draft));
                    setOpen(false);
                  }}
                />
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}
    </View>
  );
}

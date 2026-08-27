export interface DatePickerFieldProps {
  label: string;
  value: string | null;
  placeholder: string;
  minimum?: string;
  maximum?: string;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  clearLabel: string;
  todayLabel?: string;
  cancelLabel: string;
  confirmLabel: string;
  onChange(value: string | null): void;
}

export function dateFromLocalIso(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year!, month! - 1, day!);
}

export function localIsoFromDate(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

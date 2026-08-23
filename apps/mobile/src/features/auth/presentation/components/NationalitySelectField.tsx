import { useMemo } from 'react';
import { View } from 'react-native';
import {
  countryFlag,
  countryName,
  isoAlpha2Codes,
  type IsoAlpha2Code,
} from '@palea/contracts';
import { AppText, SearchableSelect, type SelectOption } from '@palea/ui-native';
import { useLocale } from '@/core/localization/LocaleProvider';

export function CountryFlag({ code }: { code: string }) {
  return (
    <AppText accessibilityLabel={`Bandera de ${code}`} variant="body">
      {countryFlag(code)}
    </AppText>
  );
}

interface NationalitySelectFieldProps {
  value: string;
  error?: string;
  disabled?: boolean;
  onChange(value: string): void;
}

/** Feature-local composition: ISO is persisted; flags are never the sole identifier. */
export function NationalitySelectField({
  value,
  error,
  disabled,
  onChange,
}: NationalitySelectFieldProps) {
  const { i18n, t } = useLocale('auth');
  const locale = i18n.language.startsWith('en') ? 'en' : 'es';
  const options = useMemo<readonly SelectOption<IsoAlpha2Code>[]>(
    () =>
      isoAlpha2Codes
        .map((code) => ({
          value: code,
          label: countryName(code, locale),
          description: `${countryName(code, locale)} · ${code}`,
          keywords: [countryName(code, 'es'), countryName(code, 'en'), code],
        }))
        .sort((first, second) =>
          first.label.localeCompare(second.label, locale),
        ),
    [locale],
  );

  return (
    <SearchableSelect
      label={t('field.nationality')}
      value={value as IsoAlpha2Code | undefined}
      options={options}
      placeholder={t('field.nationalityPlaceholder')}
      searchPlaceholder={t('field.nationalitySearch')}
      emptyMessage={t('field.nationalityEmpty')}
      required
      disabled={disabled}
      error={error}
      renderLeading={(option) => (
        <View className="w-6">
          <CountryFlag code={option.value} />
        </View>
      )}
      onValueChange={onChange}
    />
  );
}

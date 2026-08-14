import { useMemo, useState, type PropsWithChildren } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';

export function AuthScaffold({
  title,
  children,
}: PropsWithChildren<{ title: string }>) {
  return (
    <ScrollView
      contentContainerStyle={{
        flexGrow: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fcf8f8',
        padding: 24,
      }}
    >
      <View
        style={{
          width: '100%',
          maxWidth: 520,
          backgroundColor: '#fff',
          borderRadius: 20,
          borderWidth: 1,
          borderColor: '#D4D4D4',
          padding: 24,
          gap: 16,
        }}
      >
        <Text
          accessibilityRole="header"
          style={{
            fontSize: 28,
            lineHeight: 34,
            fontWeight: '700',
            color: '#1A1A1A',
          }}
        >
          {title}
        </Text>
        {children}
      </View>
    </ScrollView>
  );
}

export function Field(props: TextInputProps & { label: string }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ fontSize: 14, fontWeight: '500', color: '#4A4A4A' }}>
        {props.label}
      </Text>
      <TextInput
        {...props}
        accessibilityLabel={props.label}
        placeholderTextColor="#8A8A8A"
        style={[
          {
            minHeight: 48,
            borderWidth: 1,
            borderColor: '#D4D4D4',
            borderRadius: 12,
            paddingHorizontal: 14,
            backgroundColor: '#fff',
            color: '#1A1A1A',
          },
          props.style,
        ]}
      />
    </View>
  );
}

export function Action({
  label,
  onPress,
  secondary = false,
  loading = false,
  disabled = false,
}: {
  label: string;
  onPress(): void;
  secondary?: boolean;
  loading?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled, busy: loading }}
      disabled={disabled || loading}
      onPress={onPress}
      style={{
        minHeight: 48,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: secondary ? '#D4D4D4' : '#0F9D8C',
        backgroundColor: secondary ? '#fff' : '#0F9D8C',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {loading ? (
        <ActivityIndicator color={secondary ? '#1A1A1A' : '#fff'} />
      ) : (
        <Text
          style={{ fontWeight: '600', color: secondary ? '#1A1A1A' : '#fff' }}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

export function ErrorMessage({ message }: { message: string | null }) {
  return message ? (
    <Text accessibilityRole="alert" style={{ color: '#C62828' }}>
      {message}
    </Text>
  ) : null;
}

export function Choice({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress(): void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      style={{
        borderWidth: 1,
        borderColor: selected ? '#0F9D8C' : '#D4D4D4',
        backgroundColor: selected ? '#E7F5F4' : '#fff',
        borderRadius: 999,
        paddingVertical: 8,
        paddingHorizontal: 12,
      }}
    >
      <Text>{label}</Text>
    </Pressable>
  );
}

export function CountrySelector({
  label,
  locale,
  onSelect,
}: {
  label: string;
  locale: string;
  onSelect(code: string): void;
}) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(false);
  const countries = useMemo(
    () => findCountries(query, locale),
    [locale, query],
  );

  return (
    <View style={{ gap: 6 }}>
      <Field
        label={label}
        value={query}
        onChangeText={(value) => {
          setQuery(value);
          setSelected(false);
          onSelect('');
        }}
      />
      {query && !selected ? (
        <View style={{ gap: 4 }}>
          {countries.map((country) => (
            <Pressable
              key={country.code}
              accessibilityRole="button"
              onPress={() => {
                setQuery(country.label);
                setSelected(true);
                onSelect(country.code);
              }}
              style={{
                padding: 10,
                borderRadius: 8,
                backgroundColor: '#F2F2F2',
              }}
            >
              <Text>{country.label}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function findCountries(query: string, locale: string) {
  if (query.trim().length < 1 || typeof Intl.DisplayNames === 'undefined')
    return [];
  const names = new Intl.DisplayNames([locale], { type: 'region' });
  const normalized = query.toLocaleLowerCase(locale);
  const result: { code: string; label: string }[] = [];
  for (let first = 65; first <= 90 && result.length < 8; first += 1) {
    for (let second = 65; second <= 90 && result.length < 8; second += 1) {
      const code = String.fromCharCode(first, second);
      const countryLabel = names.of(code);
      if (
        countryLabel &&
        countryLabel !== code &&
        countryLabel.toLocaleLowerCase(locale).includes(normalized)
      ) {
        result.push({ code, label: countryLabel });
      }
    }
  }
  return result;
}

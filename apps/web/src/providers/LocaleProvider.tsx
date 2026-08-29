'use client';

import { useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import i18next from 'i18next';
import {
  I18nextProvider,
  initReactI18next,
  useTranslation,
} from 'react-i18next';
import {
  defaultLocale,
  resources,
  supportedLocales,
} from '@palea/localization';

export function LocaleProvider({
  locale,
  children,
}: PropsWithChildren<{ locale: string }>) {
  const [resolvedLocale, setResolvedLocale] = useState(
    locale === 'browser' ? defaultLocale : locale,
  );
  useEffect(() => {
    if (locale !== 'browser') return;
    const nextLocale = navigator.language.toLowerCase().startsWith('en')
      ? 'en'
      : defaultLocale;
    setResolvedLocale(nextLocale);
    document.documentElement.lang = nextLocale;
  }, [locale]);
  const instance = useMemo(() => {
    const value = i18next.createInstance().use(initReactI18next);
    void value.init({
      lng: resolvedLocale,
      fallbackLng: defaultLocale,
      supportedLngs: [...supportedLocales],
      load: 'languageOnly',
      resources,
      ns: ['common', 'projects', 'web'],
      defaultNS: 'common',
      interpolation: { escapeValue: false },
      react: { useSuspense: false },
    });
    return value;
  }, [resolvedLocale]);
  return <I18nextProvider i18n={instance}>{children}</I18nextProvider>;
}

export const useLocale = useTranslation;

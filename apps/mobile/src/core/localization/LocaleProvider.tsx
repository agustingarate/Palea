import { useMemo, type PropsWithChildren } from 'react';
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
  const instance = useMemo(() => {
    const value = i18next.createInstance().use(initReactI18next);
    void value.init({
      lng: locale,
      fallbackLng: defaultLocale,
      supportedLngs: [...supportedLocales],
      load: 'languageOnly',
      resources,
      ns: ['common', 'projects', 'web', 'auth', 'applications', 'resumes'],
      defaultNS: 'common',
      interpolation: { escapeValue: false },
      react: { useSuspense: false },
    });
    return value;
  }, [locale]);
  return <I18nextProvider i18n={instance}>{children}</I18nextProvider>;
}

export const useLocale = useTranslation;

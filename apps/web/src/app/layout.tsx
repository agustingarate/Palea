import type { CSSProperties, PropsWithChildren } from 'react';
import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { Inter } from 'next/font/google';
import { defaultLocale, resources, type Locale } from '@palea/localization';
import { themes, toCssVariables } from '@palea/design-tokens';
import { ApiProvider } from '../providers/ApiProvider';
import { LocaleProvider } from '../providers/LocaleProvider';
import './globals.css';

const inter = Inter({ subsets: ['latin'], display: 'swap' });
export async function generateMetadata(): Promise<Metadata> {
  const locale: Locale = (await headers())
    .get('accept-language')
    ?.toLowerCase()
    .startsWith('en')
    ? 'en'
    : defaultLocale;
  return {
    title: 'Palea',
    description: resources[locale].web['hero.description'],
  };
}

export default async function RootLayout({ children }: PropsWithChildren) {
  const locale: Locale = (await headers())
    .get('accept-language')
    ?.toLowerCase()
    .startsWith('en')
    ? 'en'
    : defaultLocale;
  return (
    <html lang={locale} style={toCssVariables(themes.light) as CSSProperties}>
      <body className={inter.className}>
        <LocaleProvider locale={locale}>
          <ApiProvider>{children}</ApiProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}

import type { CSSProperties, PropsWithChildren } from 'react';
import type { Metadata } from 'next';
import { defaultLocale, resources } from '@palea/localization';
import { themes, toCssVariables } from '@palea/design-tokens';
import { LocaleProvider } from '../providers/LocaleProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'Palea',
  description: resources[defaultLocale].web['hero.description'],
};

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html
      lang={defaultLocale}
      style={toCssVariables(themes.light) as CSSProperties}
    >
      <body>
        <LocaleProvider locale="browser">{children}</LocaleProvider>
      </body>
    </html>
  );
}

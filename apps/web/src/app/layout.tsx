import type { CSSProperties, PropsWithChildren } from 'react';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { themes, toCssVariables } from '@palea/design-tokens';
import { ApiProvider } from '../providers/ApiProvider';
import './globals.css';

const inter = Inter({ subsets: ['latin'], display: 'swap' });
export const metadata: Metadata = {
  title: 'Palea',
  description: 'Tu búsqueda laboral, organizada y en calma.',
};

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="es" style={toCssVariables(themes.light) as CSSProperties}>
      <body className={inter.className}>
        <ApiProvider>{children}</ApiProvider>
      </body>
    </html>
  );
}

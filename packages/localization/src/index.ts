import esCommon from './locales/es/common';
import esProjects from './locales/es/projects';
import esWeb from './locales/es/web';
import enCommon from './locales/en/common';
import enProjects from './locales/en/projects';
import enWeb from './locales/en/web';

export const supportedLocales = ['es', 'en'] as const;
export type Locale = (typeof supportedLocales)[number];
export const defaultLocale: Locale = 'es';

export const resources = {
  es: { common: esCommon, projects: esProjects, web: esWeb },
  en: { common: enCommon, projects: enProjects, web: enWeb },
} as const;

export type Resources = typeof resources;

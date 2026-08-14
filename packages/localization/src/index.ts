import esCommon from './locales/es/common';
import esProjects from './locales/es/projects';
import esWeb from './locales/es/web';
import enCommon from './locales/en/common';
import enProjects from './locales/en/projects';
import enWeb from './locales/en/web';
import esAuth from './locales/es/auth';
import enAuth from './locales/en/auth';

export const supportedLocales = ['es', 'en'] as const;
export type Locale = (typeof supportedLocales)[number];
export const defaultLocale: Locale = 'es';

export const resources = {
  es: { common: esCommon, projects: esProjects, web: esWeb, auth: esAuth },
  en: { common: enCommon, projects: enProjects, web: enWeb, auth: enAuth },
} as const;

export type Resources = typeof resources;

import esCommon from './locales/es/common';
import esProjects from './locales/es/projects';
import esWeb from './locales/es/web';
import enCommon from './locales/en/common';
import enProjects from './locales/en/projects';
import enWeb from './locales/en/web';
import esAuth from './locales/es/auth';
import enAuth from './locales/en/auth';
import esApplications from './locales/es/applications';
import enApplications from './locales/en/applications';
import esResumes from './locales/es/resumes';
import enResumes from './locales/en/resumes';
import esProfile from './locales/es/profile';
import enProfile from './locales/en/profile';

export const supportedLocales = ['es', 'en'] as const;
export type Locale = (typeof supportedLocales)[number];
export const defaultLocale: Locale = 'es';

export const resources = {
  es: {
    common: esCommon,
    projects: esProjects,
    web: esWeb,
    auth: esAuth,
    applications: esApplications,
    resumes: esResumes,
    profile: esProfile,
  },
  en: {
    common: enCommon,
    projects: enProjects,
    web: enWeb,
    auth: enAuth,
    applications: enApplications,
    resumes: enResumes,
    profile: enProfile,
  },
} as const;

export type Resources = typeof resources;

import type { ProfileLocale } from '../../domain/entities/Profile';

export function toProfileLocale(language: string | undefined): ProfileLocale {
  return language?.startsWith('en') ? 'en' : 'es';
}

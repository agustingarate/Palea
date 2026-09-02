import type { ProfileLocale } from '../../domain/entities/Profile';

export const profileQueryKeys = {
  all: ['profile'] as const,
  detail: (locale: ProfileLocale) => ['profile', 'detail', locale] as const,
  interests: (locale: ProfileLocale, search: string) =>
    ['profile', 'interests', locale, search] as const,
  experiences: () => ['profile', 'experiences'] as const,
  experience: (experienceId: string) =>
    ['profile', 'experiences', experienceId] as const,
  skills: (locale: ProfileLocale, search: string) =>
    ['profile', 'skills', locale, search] as const,
};

import type { AccountProfile } from '@palea/contracts';

/** Single source of truth for email, OAuth callback and partial-registration recovery. */
export function resolvePostAuthRoute(account: AccountProfile) {
  if (account.missing.includes('personal')) return '/auth/personal-data' as const;
  if (!account.onboardingCompletedAt) return '/onboarding/profile' as const;
  return '/' as const;
}

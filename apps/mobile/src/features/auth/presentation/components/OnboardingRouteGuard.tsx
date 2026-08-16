import type { PropsWithChildren } from 'react';
import { Redirect } from 'expo-router';
import { useAuthSession } from '../providers/AuthProvider';

/** Onboarding is private: guests are sent to login with an explicit explanation. */
export function OnboardingRouteGuard({ children }: PropsWithChildren) {
  const { session, isRestoring } = useAuthSession();
  if (isRestoring) return null;
  if (!session) return <Redirect href="/auth/login?notice=onboarding-auth" />;
  return children;
}
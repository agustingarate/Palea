import type { PropsWithChildren } from 'react';
import { Redirect } from 'expo-router';
import { useAuthSession } from '../providers/AuthProvider';

/** Login and registration are only available until a session is restored. */
export function PublicOnlyRouteGuard({ children }: PropsWithChildren) {
  const { session, isRestoring } = useAuthSession();
  if (isRestoring) return null;
  if (session) return <Redirect href="/" />;
  return children;
}

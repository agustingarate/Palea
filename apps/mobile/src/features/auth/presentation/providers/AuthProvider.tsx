import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import type { AuthSession } from '../../domain/entities/AuthSession';
import type { AuthRepository } from '../../domain/repositories/AuthRepository';
import { dependencyTokens } from '@/core/di/dependencies';
import { useDependency } from '@/core/di/DependenciesProvider';

interface AuthContextValue {
  session: AuthSession | null;
  isRestoring: boolean;
  refresh(): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function AuthSessionProvider({ children, repository }: PropsWithChildren<{ repository: AuthRepository }>) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isRestoring, setRestoring] = useState(true);
  const refresh = async () => setSession(await repository.getSession());

  useEffect(() => {
    let mounted = true;
    void repository.getSession().then((next) => {
      if (mounted) { setSession(next); setRestoring(false); }
    });
    const unsubscribe = repository.subscribe(setSession);
    return () => { mounted = false; unsubscribe(); };
  }, [repository]);

  const value = useMemo(() => ({ session, isRestoring, refresh }), [session, isRestoring]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function AuthProvider({ children }: PropsWithChildren) {
  return <AuthSessionProvider repository={useDependency(dependencyTokens.authRepository)}>{children}</AuthSessionProvider>;
}

export function useAuthSession() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuthSession must be used inside AuthProvider.');
  return context;
}

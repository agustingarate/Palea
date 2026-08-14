import type { Session } from '@supabase/supabase-js';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { useDependency } from '@/core/di/DependenciesProvider';
import { dependencyTokens } from '@/core/di/dependencies';
import type { AuthRepository, SocialProvider } from '../domain/AuthRepository';

interface AuthContextValue {
  session: Session | null;
  loading: boolean;
  signUp(input: {
    email: string;
    password: string;
    fullName: string;
  }): Promise<void>;
  signIn(email: string, password: string): Promise<void>;
  signInWithSocial(provider: SocialProvider): Promise<void>;
  signOut(): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const repository = useDependency(dependencyTokens.authRepository);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    void repository.getSession().then((value) => {
      setSession(value);
      setLoading(false);
    });
    return repository.subscribe((value) => {
      setSession(value);
      setLoading(false);
    });
  }, [repository]);
  const value = useMemo(
    () => createValue(repository, session, loading),
    [repository, session, loading],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function createValue(
  repository: AuthRepository,
  session: Session | null,
  loading: boolean,
): AuthContextValue {
  return {
    session,
    loading,
    signUp: (input) => repository.signUp(input),
    signIn: (email, password) => repository.signIn(email, password),
    signInWithSocial: (provider) => repository.signInWithSocial(provider),
    signOut: () => repository.signOut(),
  };
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('AuthProvider is missing');
  return value;
}

import type { Session } from '@supabase/supabase-js';

export type SocialProvider = 'google' | 'linkedin_oidc';

export interface AuthRepository {
  getSession(): Promise<Session | null>;
  getAccessToken(): Promise<string | null>;
  subscribe(listener: (session: Session | null) => void): () => void;
  signUp(input: {
    email: string;
    password: string;
    fullName: string;
  }): Promise<void>;
  signIn(email: string, password: string): Promise<void>;
  signInWithSocial(provider: SocialProvider): Promise<void>;
  exchangeCode(code: string): Promise<void>;
  signOut(): Promise<void>;
}

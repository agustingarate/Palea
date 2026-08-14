import type { AuthSession, SocialProvider } from '../entities/AuthSession';

export interface AuthRepository {
  getSession(): Promise<AuthSession | null>;
  getAccessToken(): Promise<string | null>;
  subscribe(listener: (session: AuthSession | null) => void): () => void;
  signUp(input: { email: string; password: string; fullName: string }): Promise<void>;
  signIn(input: { email: string; password: string }): Promise<void>;
  signInWithSocial(provider: SocialProvider): Promise<void>;
  exchangeOAuthCode(code: string): Promise<void>;
  signOut(): Promise<void>;
}

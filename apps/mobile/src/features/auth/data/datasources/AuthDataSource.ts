import type { SocialProvider } from '../../domain/entities/AuthSession';

export interface AuthDataSourceSession {
  userId: string;
  email: string | null;
  accessToken: string;
}

export interface AuthDataSource {
  getSession(): Promise<AuthDataSourceSession | null>;
  subscribe(
    listener: (session: AuthDataSourceSession | null) => void,
  ): () => void;
  signUp(input: {
    email: string;
    password: string;
    fullName: string;
  }): Promise<void>;
  signIn(input: { email: string; password: string }): Promise<void>;
  signInWithSocial(provider: SocialProvider): Promise<void>;
  exchangeOAuthCode(code: string): Promise<void>;
  signOut(): Promise<void>;
}

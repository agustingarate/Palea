import type { AuthRepository } from '../../domain/repositories/AuthRepository';
import type { AuthDataSource } from '../datasources/AuthDataSource';

export class AuthRepositoryImpl implements AuthRepository {
  constructor(private readonly dataSource: AuthDataSource) {}

  async getSession() {
    const session = await this.dataSource.getSession();
    return session ? { userId: session.userId, email: session.email } : null;
  }
  async getAccessToken() { return (await this.dataSource.getSession())?.accessToken ?? null; }
  subscribe(listener: Parameters<AuthRepository['subscribe']>[0]) {
    return this.dataSource.subscribe((session) => listener(session ? { userId: session.userId, email: session.email } : null));
  }
  signUp(input: Parameters<AuthRepository['signUp']>[0]) { return this.dataSource.signUp(input); }
  signIn(input: Parameters<AuthRepository['signIn']>[0]) { return this.dataSource.signIn(input); }
  signInWithSocial(provider: Parameters<AuthRepository['signInWithSocial']>[0]) { return this.dataSource.signInWithSocial(provider); }
  exchangeOAuthCode(code: string) { return this.dataSource.exchangeOAuthCode(code); }
  signOut() { return this.dataSource.signOut(); }
}

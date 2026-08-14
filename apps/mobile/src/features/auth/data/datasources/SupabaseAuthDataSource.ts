import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import type { AuthDataSource } from './AuthDataSource';

export class SupabaseAuthDataSource implements AuthDataSource {
  private readonly client;

  constructor(url: string, publishableKey: string) {
    this.client = createClient(url, publishableKey, {
      auth: { persistSession: true, autoRefreshToken: true, flowType: 'pkce' },
    });
  }

  async getSession() {
    const { data } = await this.client.auth.getSession();
    return data.session
      ? { userId: data.session.user.id, email: data.session.user.email ?? null, accessToken: data.session.access_token }
      : null;
  }

  subscribe(listener: Parameters<AuthDataSource['subscribe']>[0]) {
    const { data } = this.client.auth.onAuthStateChange((_event, session) =>
      listener(session ? { userId: session.user.id, email: session.user.email ?? null, accessToken: session.access_token } : null),
    );
    return () => data.subscription.unsubscribe();
  }

  async signUp(input: { email: string; password: string; fullName: string }) {
    const { error } = await this.client.auth.signUp({ email: input.email, password: input.password, options: { data: { full_name: input.fullName } } });
    if (error) throw error;
  }
  async signIn(input: { email: string; password: string }) {
    const { error } = await this.client.auth.signInWithPassword(input);
    if (error) throw error;
  }
  async signInWithSocial(provider: 'google' | 'linkedin_oidc') {
    const { error } = await this.client.auth.signInWithOAuth({ provider, options: { redirectTo: location.href } });
    if (error) throw error;
  }
  async exchangeOAuthCode(code: string) { const { error } = await this.client.auth.exchangeCodeForSession(code); if (error) throw error; }
  async signOut() { const { error } = await this.client.auth.signOut({ scope: 'local' }); if (error) throw error; }
}

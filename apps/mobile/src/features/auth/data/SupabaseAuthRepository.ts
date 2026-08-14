import 'react-native-url-polyfill/auto';
import { createClient, type Session } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import type { AuthRepository, SocialProvider } from '../domain/AuthRepository';
import { secureSessionStorage } from './secureSessionStorage';

WebBrowser.maybeCompleteAuthSession();

export class SupabaseAuthRepository implements AuthRepository {
  readonly client;

  constructor(
    url: string,
    publishableKey: string,
    private readonly webCallbackUrl: string,
  ) {
    this.client = createClient(url, publishableKey, {
      auth: {
        storage: secureSessionStorage,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: Platform.OS === 'web',
        flowType: 'pkce',
      },
    });
  }

  async getSession() {
    return (await this.client.auth.getSession()).data.session;
  }
  async getAccessToken() {
    return (await this.getSession())?.access_token ?? null;
  }
  subscribe(listener: (session: Session | null) => void) {
    const { data } = this.client.auth.onAuthStateChange((_event, session) =>
      listener(session),
    );
    return () => data.subscription.unsubscribe();
  }
  async signUp(input: { email: string; password: string; fullName: string }) {
    const { error } = await this.client.auth.signUp({
      email: input.email,
      password: input.password,
      options: { data: { full_name: input.fullName } },
    });
    if (error) throw new Error(error.message);
  }
  async signIn(email: string, password: string) {
    const { error } = await this.client.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw new Error(error.message);
  }
  async signInWithSocial(provider: SocialProvider) {
    const redirectTo =
      Platform.OS === 'web'
        ? this.webCallbackUrl
        : Linking.createURL('auth/callback');
    const { data, error } = await this.client.auth.signInWithOAuth({
      provider,
      options: { redirectTo, skipBrowserRedirect: Platform.OS !== 'web' },
    });
    if (error) throw new Error(error.message);
    if (Platform.OS !== 'web' && data.url) {
      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        redirectTo,
      );
      if (result.type === 'success') {
        const code = new URL(result.url).searchParams.get('code');
        if (code) await this.exchangeCode(code);
      }
    }
  }
  async exchangeCode(code: string) {
    const { error } = await this.client.auth.exchangeCodeForSession(code);
    if (error) throw new Error(error.message);
  }
  async signOut() {
    const { error } = await this.client.auth.signOut({ scope: 'local' });
    if (error) throw new Error(error.message);
  }
}

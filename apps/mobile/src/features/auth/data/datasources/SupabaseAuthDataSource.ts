import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import type { AuthDataSource } from './AuthDataSource';
import { supabaseSessionStorage } from '../platform/SupabaseSessionStorage';

WebBrowser.maybeCompleteAuthSession();

const requestTimeoutMs = 15_000;

/** Prevents an unavailable local Supabase instance from leaving auth CTAs pending forever. */
async function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const onAbort = () => controller.abort();
  init?.signal?.addEventListener('abort', onAbort, { once: true });
  const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
    init?.signal?.removeEventListener('abort', onAbort);
  }
}

export class SupabaseAuthDataSource implements AuthDataSource {
  private readonly client;

  constructor(url: string, publishableKey: string) {
    this.client = createClient(url, publishableKey, {
      global: { fetch: fetchWithTimeout },
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        flowType: 'pkce',
        storage: supabaseSessionStorage,
        detectSessionInUrl: Platform.OS === 'web',
      },
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
    const redirectTo = Linking.createURL('auth/callback');
    const { data, error } = await this.client.auth.signInWithOAuth({
      provider,
      options: { redirectTo, skipBrowserRedirect: Platform.OS !== 'web' },
    });
    if (error) throw error;
    if (Platform.OS === 'web') return;
    if (!data.url) throw new Error('OAuth did not return an authorization URL.');

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type !== 'success') return;
    const code = new URL(result.url).searchParams.get('code');
    if (!code) throw new Error('OAuth callback did not include an authorization code.');
    await this.exchangeOAuthCode(code);
  }
  async exchangeOAuthCode(code: string) { const { error } = await this.client.auth.exchangeCodeForSession(code); if (error) throw error; }
  async signOut() { const { error } = await this.client.auth.signOut({ scope: 'local' }); if (error) throw error; }
}

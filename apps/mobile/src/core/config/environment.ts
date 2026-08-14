import { z } from 'zod';

export const environmentSchema = z.object({
  paleaEnvironment: z.enum(['development', 'staging', 'production']),
  apiUrl: z.url(),
  projectsSource: z.enum(['memory', 'trpc', 'rest']),
  supabaseUrl: z.url(),
  supabasePublishableKey: z.string().min(1),
  authCallbackUrl: z.url(),
  authProviders: z.array(z.enum(['email', 'google', 'linkedin_oidc'])).min(1),
});

export function parseEnvironment(input: Record<string, string | undefined>) {
  return environmentSchema.parse({
    paleaEnvironment: input.EXPO_PUBLIC_PALEA_ENV,
    apiUrl: input.EXPO_PUBLIC_API_URL,
    projectsSource: input.EXPO_PUBLIC_PROJECTS_SOURCE,
    supabaseUrl: input.EXPO_PUBLIC_SUPABASE_URL ?? 'http://127.0.0.1:54321',
    supabasePublishableKey:
      input.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? 'local-publishable-key',
    authCallbackUrl:
      input.EXPO_PUBLIC_AUTH_CALLBACK_URL ??
      'http://localhost:8081/auth/callback',
    authProviders: (
      input.EXPO_PUBLIC_AUTH_PROVIDERS ?? 'email,google,linkedin_oidc'
    )
      .split(',')
      .map((provider) => provider.trim()),
  });
}

export const environment = parseEnvironment({
  EXPO_PUBLIC_PALEA_ENV: process.env.EXPO_PUBLIC_PALEA_ENV,
  EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
  EXPO_PUBLIC_PROJECTS_SOURCE: process.env.EXPO_PUBLIC_PROJECTS_SOURCE,
  EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
  EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  EXPO_PUBLIC_AUTH_CALLBACK_URL: process.env.EXPO_PUBLIC_AUTH_CALLBACK_URL,
  EXPO_PUBLIC_AUTH_PROVIDERS: process.env.EXPO_PUBLIC_AUTH_PROVIDERS,
});

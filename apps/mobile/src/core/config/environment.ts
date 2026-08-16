import { z } from 'zod';

export const environmentSchema = z.object({
  paleaEnvironment: z.enum(['development', 'staging', 'production']),
  apiUrl: z.url(),
  projectsSource: z.enum(['memory', 'trpc', 'rest']),
  supabaseUrl: z.url(),
  supabasePublishableKey: z.string().min(1),
});

export function parseEnvironment(input: Record<string, string | undefined>) {
  return environmentSchema.parse({
    paleaEnvironment: input.EXPO_PUBLIC_PALEA_ENV,
    apiUrl: input.EXPO_PUBLIC_API_URL,
    projectsSource: input.EXPO_PUBLIC_PROJECTS_SOURCE,
    supabaseUrl: input.EXPO_PUBLIC_SUPABASE_URL,
    supabasePublishableKey: input.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });
}

export const environment = parseEnvironment({
  EXPO_PUBLIC_PALEA_ENV: process.env.EXPO_PUBLIC_PALEA_ENV,
  EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
  EXPO_PUBLIC_PROJECTS_SOURCE: process.env.EXPO_PUBLIC_PROJECTS_SOURCE,
  EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
  EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
});

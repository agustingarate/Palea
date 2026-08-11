import { z } from 'zod';

export const environmentSchema = z.object({
  paleaEnvironment: z.enum(['development', 'staging', 'production']),
  apiUrl: z.url(),
  projectsSource: z.enum(['memory', 'trpc', 'rest']),
});

export function parseEnvironment(input: Record<string, string | undefined>) {
  return environmentSchema.parse({
    paleaEnvironment: input.EXPO_PUBLIC_PALEA_ENV,
    apiUrl: input.EXPO_PUBLIC_API_URL,
    projectsSource: input.EXPO_PUBLIC_PROJECTS_SOURCE,
  });
}

export const environment = parseEnvironment(process.env);

import { z } from 'zod';

const environmentSchema = z.object({
  apiUrl: z.url(),
  projectsSource: z.enum(['memory', 'trpc', 'rest']),
});

export const environment = environmentSchema.parse({
  apiUrl: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001',
  projectsSource: process.env.EXPO_PUBLIC_PROJECTS_SOURCE ?? 'memory',
});

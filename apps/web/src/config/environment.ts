import { z } from 'zod';

export const environmentSchema = z.object({
  paleaEnvironment: z.enum(['development', 'staging', 'production']),
  apiUrl: z.url(),
});

export function parseEnvironment(input: Record<string, string | undefined>) {
  return environmentSchema.parse({
    paleaEnvironment: input.NEXT_PUBLIC_PALEA_ENV,
    apiUrl: input.NEXT_PUBLIC_API_URL,
  });
}

export const environment = parseEnvironment(process.env);

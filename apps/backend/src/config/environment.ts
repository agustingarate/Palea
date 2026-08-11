import { z } from 'zod';

if (process.env.NODE_ENV !== 'production') {
  try {
    process.loadEnvFile('.env.local');
  } catch (error) {
    if (!(error instanceof Error) || !error.message.includes('ENOENT')) {
      throw error;
    }
  }
}

export const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']),
  PALEA_ENV: z.enum(['development', 'staging', 'production']),
  PORT: z.coerce.number().int().min(1).max(65535),
  CORS_ORIGINS: z
    .string()
    .transform((origins) =>
      origins
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
    )
    .pipe(z.array(z.url()).min(1)),
});

export function parseEnvironment(input: Record<string, string | undefined>) {
  const parsed = environmentSchema.parse(input);
  return {
    nodeEnv: parsed.NODE_ENV,
    paleaEnvironment: parsed.PALEA_ENV,
    port: parsed.PORT,
    corsOrigins: parsed.CORS_ORIGINS,
  };
}

export const environment = parseEnvironment(process.env);

import { z } from 'zod';
import { existsSync } from 'node:fs';

if (process.env.NODE_ENV !== 'production' && existsSync('.env.local')) {
  process.loadEnvFile('.env.local');
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
  SUPABASE_URL: z.url().default('http://127.0.0.1:54321'),
  SUPABASE_PUBLISHABLE_KEY: z.string().min(1).default('local-publishable-key'),
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(1)
    .default('local-service-role-key'),
  DATABASE_URL: z
    .string()
    .min(1)
    .default('postgresql://postgres:postgres@127.0.0.1:54322/postgres'),
  DIRECT_URL: z
    .string()
    .min(1)
    .default('postgresql://postgres:postgres@127.0.0.1:54322/postgres'),
  RESUME_UPLOAD_TTL_SECONDS: z.coerce
    .number()
    .int()
    .min(60)
    .max(3600)
    .default(600),
});

export function parseEnvironment(input: Record<string, string | undefined>) {
  const parsed = environmentSchema.parse(input);
  return {
    nodeEnv: parsed.NODE_ENV,
    paleaEnvironment: parsed.PALEA_ENV,
    port: parsed.PORT,
    corsOrigins: parsed.CORS_ORIGINS,
    supabaseUrl: parsed.SUPABASE_URL,
    supabasePublishableKey: parsed.SUPABASE_PUBLISHABLE_KEY,
    supabaseServiceRoleKey: parsed.SUPABASE_SERVICE_ROLE_KEY,
    databaseUrl: parsed.DATABASE_URL,
    directUrl: parsed.DIRECT_URL,
    resumeUploadTtlSeconds: parsed.RESUME_UPLOAD_TTL_SECONDS,
  };
}

export const environment = parseEnvironment(process.env);

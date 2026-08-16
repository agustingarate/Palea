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
  SUPABASE_URL: z.url(),
  SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().min(1),
  RESUME_UPLOAD_TTL_SECONDS: z.coerce
    .number()
    .int()
    .min(60)
    .max(3600)
    .default(600),
  RESUME_MAX_PENDING_UPLOADS: z.coerce.number().int().min(1).max(20),
  RESUME_MAX_RESERVATIONS_PER_WINDOW: z.coerce.number().int().min(1).max(100),
  RESUME_RESERVATION_WINDOW_SECONDS: z.coerce.number().int().min(60).max(86_400),
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
    resumeMaxPendingUploads: parsed.RESUME_MAX_PENDING_UPLOADS,
    resumeMaxReservationsPerWindow: parsed.RESUME_MAX_RESERVATIONS_PER_WINDOW,
    resumeReservationWindowSeconds: parsed.RESUME_RESERVATION_WINDOW_SECONDS,
  };
}

export const environment = parseEnvironment(process.env);

import { z } from 'zod';

const environmentSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  CORS_ORIGINS: z
    .string()
    .default('http://localhost:3000,http://localhost:8081'),
});

const parsed = environmentSchema.parse(process.env);
export const environment = {
  nodeEnv: parsed.NODE_ENV,
  port: parsed.PORT,
  corsOrigins: parsed.CORS_ORIGINS.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
};

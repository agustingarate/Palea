process.env.NODE_ENV = 'test';
process.env.PALEA_ENV = 'development';
process.env.PORT = '3001';
process.env.CORS_ORIGINS = 'http://localhost:3000,http://localhost:8081';
// Safe, syntactically valid values let unit tests load the environment module
// without requiring a local Supabase or Postgres instance.
process.env.SUPABASE_URL = 'http://127.0.0.1:54321';
process.env.SUPABASE_PUBLISHABLE_KEY = 'test-publishable-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
process.env.DATABASE_URL = 'postgresql://test:test@127.0.0.1:5432/palea';
process.env.DIRECT_URL = 'postgresql://test:test@127.0.0.1:5432/palea';
process.env.RESUME_MAX_PENDING_UPLOADS = '3';
process.env.RESUME_MAX_RESERVATIONS_PER_WINDOW = '10';
process.env.RESUME_RESERVATION_WINDOW_SECONDS = '3600';

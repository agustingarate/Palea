import { parseEnvironment } from './environment';

describe('backend environment', () => {
  it('parses an explicit staging configuration', () => {
    const environment = parseEnvironment({
      NODE_ENV: 'production',
      PALEA_ENV: 'staging',
      PORT: '3001',
      CORS_ORIGINS: 'https://app.staging.palea.com',
      SUPABASE_URL: 'https://staging.supabase.co',
      SUPABASE_PUBLISHABLE_KEY: 'staging-publishable-key',
      SUPABASE_SERVICE_ROLE_KEY: 'staging-service-role-key',
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/palea',
      DIRECT_URL: 'postgresql://user:pass@localhost:5432/palea',
      RESUME_MAX_PENDING_UPLOADS: '3',
      RESUME_MAX_RESERVATIONS_PER_WINDOW: '10',
      RESUME_RESERVATION_WINDOW_SECONDS: '3600',
    });

    expect(environment).toMatchObject({
      nodeEnv: 'production',
      paleaEnvironment: 'staging',
      port: 3001,
      corsOrigins: ['https://app.staging.palea.com'],
    });
  });

  it('rejects a missing CORS origin', () => {
    expect(() =>
      parseEnvironment({
        NODE_ENV: 'production',
        PALEA_ENV: 'production',
        PORT: '3001',
      }),
    ).toThrow();
  });
});

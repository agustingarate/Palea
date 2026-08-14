import { parseEnvironment } from './environment';

describe('backend environment', () => {
  it('parses an explicit staging configuration', () => {
    const environment = parseEnvironment({
      NODE_ENV: 'production',
      PALEA_ENV: 'staging',
      PORT: '3001',
      CORS_ORIGINS: 'https://app.staging.palea.com',
    });

    expect(environment).toEqual({
      nodeEnv: 'production',
      paleaEnvironment: 'staging',
      port: 3001,
      corsOrigins: ['https://app.staging.palea.com'],
      supabaseUrl: 'http://127.0.0.1:54321',
      supabasePublishableKey: 'local-publishable-key',
      supabaseServiceRoleKey: 'local-service-role-key',
      databaseUrl: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres',
      directUrl: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres',
      resumeUploadTtlSeconds: 600,
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

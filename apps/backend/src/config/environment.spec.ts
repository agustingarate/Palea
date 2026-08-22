import { parseEnvironment } from './environment';

describe('backend environment', () => {
  it('parses an explicit staging configuration', () => {
    const environment = parseEnvironment({
      NODE_ENV: 'production',
      PALEA_ENV: 'staging',
      PORT: '3001',
      CORS_ORIGINS: 'https://app.staging.palea.com',
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

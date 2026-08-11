import { createAppConfig } from './app.config';

describe('Expo app configuration', () => {
  it('uses the shared staging identity for a development client', () => {
    const config = createAppConfig({
      appVariant: 'development',
      paleaEnvironment: 'staging',
    });
    expect(config.android?.package).toBe('com.palea.app.stg');
    expect(config.ios?.bundleIdentifier).toBe('com.palea.app.stg');
  });

  it('uses the shared staging identity for a staging preview', () => {
    const config = createAppConfig({
      appVariant: 'preview',
      paleaEnvironment: 'staging',
    });
    expect(config.android?.package).toBe('com.palea.app.stg');
    expect(config.scheme).toBe('palea-stg');
  });

  it('uses the production identity for a production-targeted preview', () => {
    const config = createAppConfig({
      appVariant: 'preview',
      paleaEnvironment: 'production',
    });
    expect(config.android?.package).toBe('com.palea.app');
    expect(config.name).toBe('Palea Preview PROD');
  });
});

import { parseEnvironment } from './environment';

describe('mobile environment', () => {

  it('parses an explicit staging configuration', () => {
    const environment = parseEnvironment({
      EXPO_PUBLIC_PALEA_ENV: 'staging',
      EXPO_PUBLIC_API_URL: 'https://api.staging.palea.com',
      EXPO_PUBLIC_PROJECTS_SOURCE: 'trpc',
    });

    expect(environment).toMatchObject({
      paleaEnvironment: 'staging',
      apiUrl: 'https://api.staging.palea.com',
      projectsSource: 'trpc',
    });
  });

  it('rejects a missing public API URL', () => {
    expect(() =>
      parseEnvironment({
        EXPO_PUBLIC_PALEA_ENV: 'development',
        EXPO_PUBLIC_PROJECTS_SOURCE: 'trpc',
      }),
    ).toThrow();
  });
});

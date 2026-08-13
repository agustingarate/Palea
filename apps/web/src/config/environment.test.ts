import { parseEnvironment } from './environment';

describe('web environment', () => {
  it('parses an explicit production configuration', () => {
    const environment = parseEnvironment({
      NEXT_PUBLIC_PALEA_ENV: 'production',
      NEXT_PUBLIC_API_URL: 'https://api.palea.com',
    });

    expect(environment).toEqual({
      paleaEnvironment: 'production',
      apiUrl: 'https://api.palea.com',
    });
  });

  it('rejects an invalid API URL', () => {
    expect(() =>
      parseEnvironment({
        NEXT_PUBLIC_PALEA_ENV: 'staging',
        NEXT_PUBLIC_API_URL: 'not-a-url',
      }),
    ).toThrow();
  });
});

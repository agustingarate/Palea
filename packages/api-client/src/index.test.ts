import { createPaleaApiClient } from './index';

describe('createPaleaApiClient', () => {
  it('uses the injected transport and authentication headers', async () => {
    const fetchMock = jest
      .fn<ReturnType<typeof fetch>, Parameters<typeof fetch>>()
      .mockResolvedValue(
        new Response(
          JSON.stringify([
            {
              result: {
                data: { status: 'ok' },
              },
            },
          ]),
          { status: 200, headers: { 'content-type': 'application/json' } },
        ),
      );

    const client = createPaleaApiClient({
      url: 'https://api.palea.test/trpc',
      headers: () => ({ authorization: 'Bearer test-token' }),
      fetch: fetchMock,
    });

    await expect(client.system.health.query()).resolves.toEqual({
      status: 'ok',
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [, request] = fetchMock.mock.calls[0] ?? [];
    expect(new Headers(request?.headers).get('authorization')).toBe(
      'Bearer test-token',
    );
  });
});

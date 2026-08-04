import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { z } from 'zod';
import { AxiosHttpClient } from './index';

describe('AxiosHttpClient', () => {
  it('parses successful responses at the boundary', async () => {
    const instance = axios.create();
    new MockAdapter(instance as ConstructorParameters<typeof MockAdapter>[0])
      .onGet('/health')
      .reply(200, { status: 'ok' });
    const client = new AxiosHttpClient({
      baseUrl: 'http://example.test',
      axiosInstance: instance,
    });
    await expect(
      client.request(
        { method: 'GET', path: '/health' },
        z.object({ status: z.literal('ok') }),
      ),
    ).resolves.toMatchObject({ status: 200 });
  });

  it('rejects invalid responses with a safe error', async () => {
    const instance = axios.create();
    new MockAdapter(instance as ConstructorParameters<typeof MockAdapter>[0])
      .onGet('/health')
      .reply(200, { status: 'broken' });
    const client = new AxiosHttpClient({
      baseUrl: 'http://example.test',
      axiosInstance: instance,
    });
    await expect(
      client.request(
        { method: 'GET', path: '/health' },
        z.object({ status: z.literal('ok') }),
      ),
    ).rejects.toMatchObject({ code: 'invalid-response' });
  });
});

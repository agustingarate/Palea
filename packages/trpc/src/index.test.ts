import {
  appRouter,
  type PaleaApiServices,
  type PaleaTrpcContext,
} from './index';

const context: PaleaTrpcContext = {
  requestId: 'test-request',
  identity: null,
  services: {
    systemHealth: async () => ({ status: 'ok' }),
    listProjects: async ({ limit }: { limit: number }) =>
      [
        {
          id: 'p-1',
          name: 'First application',
          company: 'Palea',
          status: 'active' as const,
          updatedAt: '2026-08-03T12:00:00.000Z',
        },
      ].slice(0, limit),
  } as unknown as PaleaApiServices,
};

describe('appRouter', () => {
  it('exposes typed system health', async () => {
    await expect(
      appRouter.createCaller(context).system.health(),
    ).resolves.toEqual({ status: 'ok' });
  });

  it('validates and lists projects', async () => {
    await expect(
      appRouter.createCaller(context).projects.list({ limit: 1 }),
    ).resolves.toHaveLength(1);
    await expect(
      appRouter.createCaller(context).projects.list({ limit: 101 }),
    ).rejects.toBeDefined();
  });
});

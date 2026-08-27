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

  it('protects and delegates application creation with the authenticated subject', async () => {
    await expect(
      appRouter.createCaller(context).applications.create({
        companyName: 'Palea',
        role: 'Engineer',
        timeZone: 'UTC',
      }),
    ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });

    const createApplication = jest.fn().mockResolvedValue({
      id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      companyName: 'Palea',
      role: 'Engineer',
      appliedOn: null,
      status: 'draft',
      workMode: 'unspecified',
      position: 0,
    });
    const authenticated = {
      ...context,
      identity: { subject: 'user-1', email: null, roles: [] },
      services: { ...context.services, createApplication },
    };

    await appRouter.createCaller(authenticated).applications.create({
      companyName: 'Palea',
      role: 'Engineer',
      timeZone: 'UTC',
    });

    expect(createApplication).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({
        companyName: 'Palea',
        appliedOn: null,
        workMode: 'unspecified',
      }),
    );
  });
});

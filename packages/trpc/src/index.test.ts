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

  it('protects, validates and delegates stage CRUD', async () => {
    const applicationId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    const stageId = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12';
    const stage = {
      id: stageId,
      applicationId,
      name: 'Interview',
      eventOn: null,
      result: 'pending' as const,
      difficulty: null,
      questions: null,
      comments: null,
      createdAt: '2026-08-29T12:00:00.000Z',
      updatedAt: '2026-08-29T12:00:00.000Z',
    };
    const createApplicationStage = jest.fn().mockResolvedValue(stage);
    const getApplicationStage = jest.fn().mockResolvedValue(stage);
    const updateApplicationStage = jest.fn().mockResolvedValue(stage);
    const deleteApplicationStage = jest
      .fn()
      .mockResolvedValue({ success: true });
    const authenticated = {
      ...context,
      identity: { subject: 'user-1', email: null, roles: [] },
      services: {
        ...context.services,
        createApplicationStage,
        getApplicationStage,
        updateApplicationStage,
        deleteApplicationStage,
      },
    };

    await appRouter.createCaller(authenticated).applications.createStage({
      applicationId,
      name: ' Interview ',
    });
    await appRouter.createCaller(authenticated).applications.getStage({
      applicationId,
      stageId,
    });
    await appRouter.createCaller(authenticated).applications.updateStage({
      applicationId,
      stageId,
      name: 'Interview',
    });
    await appRouter.createCaller(authenticated).applications.deleteStage({
      applicationId,
      stageId,
    });

    expect(createApplicationStage).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({ name: 'Interview', result: 'pending' }),
    );
    expect(getApplicationStage).toHaveBeenCalledWith(
      'user-1',
      applicationId,
      stageId,
    );
    expect(updateApplicationStage).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({ stageId, difficulty: null }),
    );
    expect(deleteApplicationStage).toHaveBeenCalledWith(
      'user-1',
      applicationId,
      stageId,
    );

    await expect(
      appRouter.createCaller(authenticated).applications.createStage({
        applicationId,
        name: 'Interview',
        result: 'failed',
      }),
    ).rejects.toBeDefined();
  });

  it('protects and delegates profile mutations with the authenticated subject', async () => {
    const updateProfileRole = jest.fn().mockResolvedValue({ success: true });
    const authenticated = {
      ...context,
      identity: { subject: 'user-1', email: null, roles: [] },
      services: { ...context.services, updateProfileRole },
    };

    await expect(
      appRouter.createCaller(context).profile.updateRole({
        roleDescription: 'Product designer',
        experienceBand: 'two_to_four',
        interestIds: ['00000000-0000-4000-8000-000000000001'],
      }),
    ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });

    await appRouter.createCaller(authenticated).profile.updateRole({
      roleDescription: 'Product designer',
      experienceBand: 'two_to_four',
      interestIds: ['00000000-0000-4000-8000-000000000001'],
    });

    expect(updateProfileRole).toHaveBeenCalledWith('user-1', {
      roleDescription: 'Product designer',
      experienceBand: 'two_to_four',
      interestIds: ['00000000-0000-4000-8000-000000000001'],
    });
  });

  it('protects and scopes a profile experience lookup to its owner', async () => {
    const experienceId = '00000000-0000-4000-8000-000000000001';
    const getProfileExperience = jest.fn().mockResolvedValue({
      id: experienceId,
      companyName: 'Palea',
      role: 'Product designer',
      startedOn: '2024-01-01',
      endedOn: null,
      isCurrent: true,
    });
    const authenticated = {
      ...context,
      identity: { subject: 'user-1', email: null, roles: [] },
      services: { ...context.services, getProfileExperience },
    };

    await expect(
      appRouter.createCaller(context).profile.experiences.get({ experienceId }),
    ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
    await appRouter
      .createCaller(authenticated)
      .profile.experiences.get({ experienceId });

    expect(getProfileExperience).toHaveBeenCalledWith('user-1', experienceId);
  });
});

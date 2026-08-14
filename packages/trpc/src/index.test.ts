import { appRouter, type PaleaTrpcContext } from './index';

const context: PaleaTrpcContext = {
  requestId: 'test-request',
  identity: null,
  services: {
    systemHealth: async () => ({ status: 'ok' }),
    listProjects: async ({ limit }) =>
      [
        {
          id: 'p-1',
          name: 'First application',
          company: 'Palea',
          status: 'active' as const,
          updatedAt: '2026-08-03T12:00:00.000Z',
        },
      ].slice(0, limit),
    getAccount: async () => ({
      id: '00000000-0000-4000-8000-000000000001',
      email: null,
      fullName: null,
      birthDate: null,
      nationality: null,
      roleDescription: null,
      experienceBand: null,
      interestIds: [],
      skillIds: [],
      hasWorkExperience: false,
      primaryResume: null,
      onboardingCompletedAt: null,
      missing: ['personal', 'profile', 'work_experience', 'skills', 'resume'],
    }),
    completeRegistration: async () => ({ success: true }),
    getOnboardingCatalog: async () => ({ interests: [], skills: [] }),
    saveOnboardingProfile: async () => ({ success: true }),
    saveWorkExperience: async () => ({ success: true }),
    saveSkills: async () => ({ success: true }),
    completeOnboarding: async () => ({ success: true }),
    reserveResumeUpload: async () => ({
      resumeId: '00000000-0000-4000-8000-000000000002',
      path: 'path',
      signedUrl: 'https://example.com/upload',
      expiresAt: '2026-08-13T00:00:00.000Z',
    }),
    confirmResumeUpload: async () => ({ success: true }),
    cancelResumeUpload: async () => ({ success: true }),
  },
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

  it('protects account procedures', async () => {
    await expect(
      appRouter.createCaller(context).account.me(),
    ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  });
});

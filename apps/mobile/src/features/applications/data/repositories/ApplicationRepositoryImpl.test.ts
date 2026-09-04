import { ApplicationRepositoryImpl } from './ApplicationRepositoryImpl';

const applicationId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const dataSource = {
  list: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  updateStatus: jest.fn(),
  remove: jest.fn(),
  get: jest.fn(),
  listStages: jest.fn(),
  getNote: jest.fn(),
  listResources: jest.fn(),
  updateResume: jest.fn(),
  createStage: jest.fn(),
  getStage: jest.fn(),
  updateStage: jest.fn(),
  deleteStage: jest.fn(),
};

describe('ApplicationRepositoryImpl', () => {
  const repository = new ApplicationRepositoryImpl(dataSource);

  beforeEach(() => jest.clearAllMocks());

  it('delegates a paged list through the datasource port', async () => {
    dataSource.list.mockResolvedValue({
      items: [
        {
          id: applicationId,
          companyName: 'Palea',
          role: 'Product designer',
          appliedOn: '2026-08-22',
          status: 'applied',
          workMode: 'remote',
          position: 0,
        },
      ],
      nextCursor: null,
      total: 1,
    });

    await expect(
      repository.list('applied', { search: 'Palea' }),
    ).resolves.toMatchObject({
      total: 1,
    });
    expect(dataSource.list).toHaveBeenCalledWith('applied', {
      search: 'Palea',
    });
  });

  it('delegates status changes and deletion to protected mutations', async () => {
    dataSource.updateStatus.mockResolvedValue(undefined);
    dataSource.remove.mockResolvedValue(undefined);

    await repository.updateStatus(applicationId, 'offer');
    await repository.remove(applicationId);

    expect(dataSource.updateStatus).toHaveBeenCalledWith(
      applicationId,
      'offer',
      undefined,
      undefined,
      undefined,
    );
    expect(dataSource.remove).toHaveBeenCalledWith(applicationId);
  });

  it('delegates creation through the datasource boundary', async () => {
    dataSource.create.mockResolvedValue({ id: applicationId });
    const input = {
      companyName: 'Palea',
      role: 'Engineer',
      appliedOn: null,
      url: null,
      location: null,
      schedule: null,
      workMode: 'unspecified' as const,
      commitment: 'unspecified' as const,
      contractType: 'unspecified' as const,
      durationType: 'unspecified' as const,
      resumeId: null,
      jobDescription: null,
      privateNotes: '',
      expectedCompensation: null,
      offeredCompensation: null,
      timeZone: 'UTC',
    };
    await repository.create(input);
    expect(dataSource.create).toHaveBeenCalledWith(input);
  });

  it('delegates complete editing through the datasource port', async () => {
    const input = {
      applicationId,
      companyName: 'Palea',
      role: 'Engineer',
      appliedOn: null,
      url: null,
      location: null,
      schedule: null,
      workMode: 'unspecified' as const,
      commitment: 'unspecified' as const,
      contractType: 'unspecified' as const,
      durationType: 'unspecified' as const,
      resumeId: null,
      jobDescription: null,
      expectedCompensation: null,
      offeredCompensation: null,
      timeZone: 'UTC',
    };
    dataSource.update.mockResolvedValue({ id: applicationId });
    await repository.update(input);
    expect(dataSource.update).toHaveBeenCalledWith(input);
  });

  it('delegates stage CRUD through the datasource port', async () => {
    const stageId = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12';
    const input = {
      applicationId,
      name: 'Interview',
      eventOn: null,
      result: 'pending' as const,
      difficulty: null,
      questions: null,
      comments: null,
    };
    await repository.createStage(input);
    await repository.getStage(applicationId, stageId);
    await repository.updateStage({ ...input, stageId });
    await repository.deleteStage(applicationId, stageId);
    expect(dataSource.createStage).toHaveBeenCalledWith(input);
    expect(dataSource.getStage).toHaveBeenCalledWith(applicationId, stageId);
    expect(dataSource.updateStage).toHaveBeenCalledWith({ ...input, stageId });
    expect(dataSource.deleteStage).toHaveBeenCalledWith(applicationId, stageId);
  });
});

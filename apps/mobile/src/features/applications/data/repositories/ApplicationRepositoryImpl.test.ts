import { ApplicationRepositoryImpl } from './ApplicationRepositoryImpl';

const applicationId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const dataSource = {
  list: jest.fn(),
  create: jest.fn(),
  updateStatus: jest.fn(),
  remove: jest.fn(),
  get: jest.fn(),
  listStages: jest.fn(),
  getNote: jest.fn(),
  listResources: jest.fn(),
  updateResume: jest.fn(),
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
});

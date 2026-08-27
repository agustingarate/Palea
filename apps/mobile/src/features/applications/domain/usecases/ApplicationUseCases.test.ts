import { DeleteApplication } from './DeleteApplication';
import { ListApplications } from './ListApplications';
import { UpdateApplicationStatus } from './UpdateApplicationStatus';
import { CreateApplication } from './CreateApplication';

const repository = {
  list: jest.fn().mockResolvedValue({ items: [], nextCursor: null, total: 0 }),
  create: jest.fn().mockResolvedValue({}),
  updateStatus: jest.fn().mockResolvedValue(undefined),
  remove: jest.fn().mockResolvedValue(undefined),
  get: jest.fn().mockResolvedValue({}),
  listStages: jest.fn().mockResolvedValue([]),
  getNote: jest.fn().mockResolvedValue(null),
  listResources: jest.fn().mockResolvedValue([]),
  updateResume: jest.fn().mockResolvedValue(undefined),
};

describe('application use cases', () => {
  beforeEach(() => jest.clearAllMocks());

  it('delegates status-scoped paging through the domain boundary', async () => {
    await new ListApplications(repository).execute('draft', {
      search: 'Palea',
    });
    expect(repository.list).toHaveBeenCalledWith('draft', { search: 'Palea' });
  });

  it('delegates creation through the domain boundary', async () => {
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
    await new CreateApplication(repository).execute(input);
    expect(repository.create).toHaveBeenCalledWith(input);
  });

  it('delegates status updates and deletion through the domain boundary', async () => {
    await new UpdateApplicationStatus(repository).execute('app-1', 'offer');
    await new DeleteApplication(repository).execute('app-1');
    expect(repository.updateStatus).toHaveBeenCalledWith(
      'app-1',
      'offer',
      undefined,
      undefined,
      undefined,
    );
    expect(repository.remove).toHaveBeenCalledWith('app-1');
  });
});

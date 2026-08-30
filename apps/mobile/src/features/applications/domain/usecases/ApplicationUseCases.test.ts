import { DeleteApplication } from './DeleteApplication';
import { ListApplications } from './ListApplications';
import { UpdateApplicationStatus } from './UpdateApplicationStatus';
import { CreateApplication } from './CreateApplication';
import {
  CreateApplicationStage,
  DeleteApplicationStage,
  GetApplicationStage,
  UpdateApplicationStage,
} from './ApplicationDetailUseCases';

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
  createStage: jest.fn().mockResolvedValue({}),
  getStage: jest.fn().mockResolvedValue({}),
  updateStage: jest.fn().mockResolvedValue({}),
  deleteStage: jest.fn().mockResolvedValue(undefined),
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

  it('delegates stage CRUD through typed use cases', async () => {
    const applicationId = 'app-1';
    const stageId = 'stage-1';
    const input = {
      applicationId,
      name: 'Interview',
      eventOn: null,
      result: 'pending' as const,
      difficulty: null,
      questions: null,
      comments: null,
    };
    await new CreateApplicationStage(repository).execute(input);
    await new GetApplicationStage(repository).execute(applicationId, stageId);
    await new UpdateApplicationStage(repository).execute({ ...input, stageId });
    await new DeleteApplicationStage(repository).execute(
      applicationId,
      stageId,
    );
    expect(repository.createStage).toHaveBeenCalledWith(input);
    expect(repository.getStage).toHaveBeenCalledWith(applicationId, stageId);
    expect(repository.updateStage).toHaveBeenCalledWith({ ...input, stageId });
    expect(repository.deleteStage).toHaveBeenCalledWith(applicationId, stageId);
  });
});

import { DeleteApplication } from './DeleteApplication';
import { ListApplications } from './ListApplications';
import { UpdateApplicationStatus } from './UpdateApplicationStatus';

const repository = {
  list: jest.fn().mockResolvedValue({ items: [], nextCursor: null, total: 0 }),
  updateStatus: jest.fn().mockResolvedValue(undefined),
  remove: jest.fn().mockResolvedValue(undefined),
};

describe('application use cases', () => {
  beforeEach(() => jest.clearAllMocks());

  it('delegates status-scoped paging through the domain boundary', async () => {
    await new ListApplications(repository).execute('draft', {
      search: 'Palea',
    });
    expect(repository.list).toHaveBeenCalledWith('draft', { search: 'Palea' });
  });

  it('delegates status updates and deletion through the domain boundary', async () => {
    await new UpdateApplicationStatus(repository).execute('app-1', 'offer');
    await new DeleteApplication(repository).execute('app-1');
    expect(repository.updateStatus).toHaveBeenCalledWith('app-1', 'offer');
    expect(repository.remove).toHaveBeenCalledWith('app-1');
  });
});

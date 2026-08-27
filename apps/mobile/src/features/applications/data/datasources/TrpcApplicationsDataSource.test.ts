import { TrpcApplicationsDataSource } from './TrpcApplicationsDataSource';

const applicationId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const client = {
  applications: {
    list: { query: jest.fn() },
    create: { mutate: jest.fn() },
    updateStatus: { mutate: jest.fn() },
    delete: { mutate: jest.fn() },
  },
};

describe('TrpcApplicationsDataSource', () => {
  const dataSource = new TrpcApplicationsDataSource(client as never);

  beforeEach(() => jest.clearAllMocks());

  it('parses untrusted tRPC responses at the boundary', async () => {
    client.applications.list.query.mockResolvedValue({ items: [], total: -1 });

    await expect(dataSource.list('draft')).rejects.toThrow();
  });

  it('rejects invalid mutation input before invoking tRPC', async () => {
    await expect(
      dataSource.updateStatus('not-a-uuid', 'offer', 0),
    ).rejects.toThrow();
    expect(client.applications.updateStatus.mutate).not.toHaveBeenCalled();
  });

  it('delegates protected operations to tRPC', async () => {
    client.applications.list.query.mockResolvedValue({
      items: [],
      nextCursor: null,
      total: 0,
    });
    client.applications.updateStatus.mutate.mockResolvedValue(undefined);
    client.applications.delete.mutate.mockResolvedValue(undefined);

    await dataSource.list('applied', { search: 'Palea' });
    await dataSource.updateStatus(applicationId, 'offer', 2, '2026-08-20', 'UTC');
    await dataSource.remove(applicationId);

    expect(client.applications.list.query).toHaveBeenCalledWith({
      status: 'applied',
      search: 'Palea',
      limit: 25,
    });
    expect(client.applications.updateStatus.mutate).toHaveBeenCalledWith({
      applicationId,
      status: 'offer',
      targetIndex: 2,
      appliedOn: '2026-08-20',
      timeZone: 'UTC',
    });
    expect(client.applications.delete.mutate).toHaveBeenCalledWith({
      applicationId,
    });
  });

  it('creates only contract-valid drafts', async () => {
    client.applications.create.mutate.mockResolvedValue({
      id: applicationId,
      companyName: 'Palea',
      role: 'Engineer',
      appliedOn: null,
      status: 'draft',
      workMode: 'unspecified',
      position: 0,
    });
    await expect(
      dataSource.create({
        companyName: 'Palea',
        role: 'Engineer',
        appliedOn: null,
        workMode: 'unspecified',
        commitment: 'unspecified',
        contractType: 'unspecified',
        durationType: 'unspecified',
        resumeId: null,
        jobDescription: null,
        privateNotes: '',
        expectedCompensation: null,
        offeredCompensation: null,
        timeZone: 'UTC',
      }),
    ).resolves.toMatchObject({ status: 'draft', appliedOn: null });
  });
});

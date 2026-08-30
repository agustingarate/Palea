import { TrpcApplicationsDataSource } from './TrpcApplicationsDataSource';

const applicationId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const stageId = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12';
const client = {
  applications: {
    list: { query: jest.fn() },
    create: { mutate: jest.fn() },
    updateStatus: { mutate: jest.fn() },
    delete: { mutate: jest.fn() },
    createStage: { mutate: jest.fn() },
    getStage: { query: jest.fn() },
    updateStage: { mutate: jest.fn() },
    deleteStage: { mutate: jest.fn() },
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
    await dataSource.updateStatus(
      applicationId,
      'offer',
      2,
      '2026-08-20',
      'UTC',
    );
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

  it('parses and delegates the complete stage CRUD at the transport boundary', async () => {
    const stage = {
      id: stageId,
      applicationId,
      name: 'Interview',
      eventOn: null,
      result: 'pending',
      difficulty: null,
      questions: null,
      comments: null,
      createdAt: '2026-08-29T12:00:00.000Z',
      updatedAt: '2026-08-29T12:00:00.000Z',
    };
    client.applications.createStage.mutate.mockResolvedValue(stage);
    client.applications.getStage.query.mockResolvedValue(stage);
    client.applications.updateStage.mutate.mockResolvedValue(stage);
    client.applications.deleteStage.mutate.mockResolvedValue({ success: true });
    const fields = {
      applicationId,
      name: 'Interview',
      eventOn: null,
      result: 'pending' as const,
      difficulty: null,
      questions: null,
      comments: null,
    };

    await dataSource.createStage(fields);
    await dataSource.getStage(applicationId, stageId);
    await dataSource.updateStage({ ...fields, stageId });
    await dataSource.deleteStage(applicationId, stageId);

    expect(client.applications.createStage.mutate).toHaveBeenCalledWith(fields);
    expect(client.applications.getStage.query).toHaveBeenCalledWith({
      applicationId,
      stageId,
    });
    expect(client.applications.updateStage.mutate).toHaveBeenCalledWith({
      ...fields,
      stageId,
    });
    expect(client.applications.deleteStage.mutate).toHaveBeenCalledWith({
      applicationId,
      stageId,
    });
  });

  it('rejects invalid stage responses and inputs', async () => {
    client.applications.getStage.query.mockResolvedValue({ id: stageId });
    await expect(dataSource.getStage(applicationId, stageId)).rejects.toThrow();
    await expect(
      dataSource.createStage({
        applicationId,
        name: 'Interview',
        eventOn: null,
        result: 'failed',
        difficulty: 'hard',
        questions: null,
        comments: null,
      }),
    ).rejects.toThrow();
  });
});

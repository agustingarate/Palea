import { TrpcResumesDataSource } from './TrpcResumesDataSource';

const resumeId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const client = {
  resume: {
    list: { query: jest.fn() },
    reserveUpload: { mutate: jest.fn() },
    confirmUpload: { mutate: jest.fn() },
    cancelUpload: { mutate: jest.fn() },
  },
};

describe('TrpcResumesDataSource', () => {
  const dataSource = new TrpcResumesDataSource(client as never);

  beforeEach(() => jest.clearAllMocks());

  it('parses ready resume responses at the boundary', async () => {
    client.resume.list.query.mockResolvedValue([{ id: 'invalid' }]);
    await expect(dataSource.list()).rejects.toThrow();
  });

  it('confirms application uploads without replacing the primary', async () => {
    client.resume.confirmUpload.mutate.mockResolvedValue(undefined);
    await dataSource.confirm({ resumeId, primaryMode: 'preserve' });
    expect(client.resume.confirmUpload.mutate).toHaveBeenCalledWith({
      resumeId,
      primaryMode: 'preserve',
    });
  });
});

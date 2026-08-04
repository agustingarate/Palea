import { ProjectRepositoryImpl } from './ProjectRepositoryImpl';

it('validates DTOs and maps dates into domain values', async () => {
  const repository = new ProjectRepositoryImpl({
    list: async () => [
      {
        id: '1',
        name: 'Palea',
        company: 'Palea',
        status: 'active',
        updatedAt: '2026-08-03T12:00:00.000Z',
      },
    ],
  });
  const [project] = await repository.list();
  expect(project?.updatedAt).toBeInstanceOf(Date);
});

it('rejects malformed datasource responses', async () => {
  const repository = new ProjectRepositoryImpl({
    list: async () => [{ id: '' }],
  });
  await expect(repository.list()).rejects.toBeDefined();
});

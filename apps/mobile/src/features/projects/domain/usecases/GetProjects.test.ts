import { GetProjects } from './GetProjects';
import type { ProjectRepository } from '../repositories/ProjectRepository';

it('delegates project retrieval to the repository', async () => {
  const projects = [
    {
      id: '1',
      name: 'Palea',
      company: 'Palea',
      status: 'active' as const,
      updatedAt: new Date(),
    },
  ];
  const repository: ProjectRepository = {
    list: jest.fn().mockResolvedValue(projects),
  };
  await expect(new GetProjects(repository).execute()).resolves.toBe(projects);
});

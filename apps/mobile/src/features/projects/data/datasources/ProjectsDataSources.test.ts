import type { PaleaApiClient } from '@palea/api-client';
import type { ProjectDto } from '@palea/contracts';
import type { HttpClient } from '@palea/http-client';
import { ProjectRepositoryImpl } from '../repositories/ProjectRepositoryImpl';
import { InMemoryProjectsDataSource } from './InMemoryProjectsDataSource';
import type { ProjectsDataSource } from './ProjectsDataSource';
import { RestProjectsDataSource } from './RestProjectsDataSource';
import { TrpcProjectsDataSource } from './TrpcProjectsDataSource';

const remoteProjects: readonly ProjectDto[] = [
  {
    id: 'project-1',
    name: 'Palea',
    company: 'Palea',
    status: 'active',
    updatedAt: '2026-08-03T12:00:00.000Z',
  },
];

describe('Projects data sources', () => {
  it('maps in-memory, tRPC and REST boundaries to the same domain model', async () => {
    const trpcClient = {
      projects: {
        list: { query: jest.fn().mockResolvedValue(remoteProjects) },
      },
    } as unknown as PaleaApiClient;
    const httpClient = {
      request: jest.fn().mockResolvedValue({
        data: remoteProjects,
        status: 200,
        headers: {},
      }),
    } as unknown as HttpClient;

    const dataSources: readonly ProjectsDataSource[] = [
      new InMemoryProjectsDataSource(),
      new TrpcProjectsDataSource(trpcClient),
      new RestProjectsDataSource(httpClient),
    ];

    for (const dataSource of dataSources) {
      const projects = await new ProjectRepositoryImpl(dataSource).list();
      expect(projects.length).toBeGreaterThan(0);
      expect(projects[0]?.updatedAt).toBeInstanceOf(Date);
      expect(projects[0]?.status).toBe('active');
    }
  });
});

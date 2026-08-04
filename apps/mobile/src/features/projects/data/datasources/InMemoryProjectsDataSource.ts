import type { ProjectDto } from '@palea/contracts';
import type { ProjectsDataSource } from './ProjectsDataSource';

const projects: readonly ProjectDto[] = [
  {
    id: 'palea-mobile',
    name: 'Aplicación mobile',
    company: 'Palea',
    status: 'active',
    updatedAt: '2026-08-03T12:00:00.000Z',
  },
  {
    id: 'palea-web',
    name: 'Web institucional',
    company: 'Palea',
    status: 'active',
    updatedAt: '2026-08-02T12:00:00.000Z',
  },
];

export class InMemoryProjectsDataSource implements ProjectsDataSource {
  async list(signal?: AbortSignal): Promise<unknown> {
    if (signal?.aborted) throw signal.reason;
    return projects;
  }
}

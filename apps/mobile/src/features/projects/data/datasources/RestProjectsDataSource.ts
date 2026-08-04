import { projectListSchema } from '@palea/contracts';
import type { HttpClient } from '@palea/http-client';
import type { ProjectsDataSource } from './ProjectsDataSource';

export class RestProjectsDataSource implements ProjectsDataSource {
  constructor(private readonly client: HttpClient) {}
  async list(signal?: AbortSignal): Promise<unknown> {
    const response = await this.client.request(
      { method: 'GET', path: '/projects', signal },
      projectListSchema,
    );
    return response.data;
  }
}

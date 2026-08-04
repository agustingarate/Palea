import type { PaleaApiClient } from '@palea/api-client';
import type { ProjectsDataSource } from './ProjectsDataSource';

export class TrpcProjectsDataSource implements ProjectsDataSource {
  constructor(private readonly client: PaleaApiClient) {}
  list(signal?: AbortSignal): Promise<unknown> {
    return this.client.projects.list.query({ limit: 20 }, { signal });
  }
}

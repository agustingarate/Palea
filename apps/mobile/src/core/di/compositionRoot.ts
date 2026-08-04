import { createPaleaApiClient } from '@palea/api-client';
import { AxiosHttpClient } from '@palea/http-client';
import { DisabledAiService } from '../ai/AiService';
import { environment } from '../config/environment';
import { InMemoryProjectsDataSource } from '@/features/projects/data/datasources/InMemoryProjectsDataSource';
import { RestProjectsDataSource } from '@/features/projects/data/datasources/RestProjectsDataSource';
import { TrpcProjectsDataSource } from '@/features/projects/data/datasources/TrpcProjectsDataSource';
import type { ProjectsDataSource } from '@/features/projects/data/datasources/ProjectsDataSource';
import { ProjectRepositoryImpl } from '@/features/projects/data/repositories/ProjectRepositoryImpl';
import { GetProjects } from '@/features/projects/domain/usecases/GetProjects';
import { Container } from './container';
import { dependencyTokens } from './dependencies';

export function createAppContainer(): Container {
  const container = new Container();
  const datasource = createProjectsDataSource();
  container.register(
    dependencyTokens.getProjects,
    new GetProjects(new ProjectRepositoryImpl(datasource)),
  );
  container.register(dependencyTokens.aiService, new DisabledAiService());
  return container;
}

function createProjectsDataSource(): ProjectsDataSource {
  if (environment.projectsSource === 'trpc') {
    return new TrpcProjectsDataSource(
      createPaleaApiClient({ url: `${environment.apiUrl}/trpc` }),
    );
  }
  if (environment.projectsSource === 'rest') {
    return new RestProjectsDataSource(
      new AxiosHttpClient({ baseUrl: environment.apiUrl }),
    );
  }
  return new InMemoryProjectsDataSource();
}

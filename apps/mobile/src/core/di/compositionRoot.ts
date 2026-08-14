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
import { SupabaseAuthDataSource } from '@/features/auth/data/datasources/SupabaseAuthDataSource';
import { TrpcOnboardingDataSource } from '@/features/auth/data/datasources/TrpcOnboardingDataSource';
import { AuthRepositoryImpl } from '@/features/auth/data/repositories/AuthRepositoryImpl';
import { OnboardingRepositoryImpl } from '@/features/auth/data/repositories/OnboardingRepositoryImpl';

export function createAppContainer(): Container {
  const container = new Container();
  const authRepository = new AuthRepositoryImpl(
    new SupabaseAuthDataSource(
      environment.supabaseUrl,
      environment.supabasePublishableKey,
    ),
  );
  const authenticatedClient = createPaleaApiClient({
    url: `${environment.apiUrl}/trpc`,
    headers: async () => {
      const token = await authRepository.getAccessToken();
      return token ? { authorization: `Bearer ${token}` } : ({} as Record<string, string>);
    },
  });
  container.register(dependencyTokens.authRepository, authRepository);
  container.register(
    dependencyTokens.onboardingRepository,
    new OnboardingRepositoryImpl(new TrpcOnboardingDataSource(authenticatedClient)),
  );
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

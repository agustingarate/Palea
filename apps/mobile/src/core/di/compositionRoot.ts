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
import { ApplicationRepositoryImpl } from '@/features/applications/data/repositories/ApplicationRepositoryImpl';
import { TrpcApplicationsDataSource } from '@/features/applications/data/datasources/TrpcApplicationsDataSource';
import { ListApplications } from '@/features/applications/domain/usecases/ListApplications';
import { UpdateApplicationStatus } from '@/features/applications/domain/usecases/UpdateApplicationStatus';
import { DeleteApplication } from '@/features/applications/domain/usecases/DeleteApplication';
import { CreateApplication } from '@/features/applications/domain/usecases/CreateApplication';
import {
  GetApplicationDetail,
  GetApplicationNote,
  ListApplicationResources,
  ListApplicationStages,
  UpdateApplicationResume,
} from '@/features/applications/domain/usecases/ApplicationDetailUseCases';
import { ResumeRepositoryImpl } from '@/features/resumes/data/repositories/ResumeRepositoryImpl';
import { TrpcResumesDataSource } from '@/features/resumes/data/datasources/TrpcResumesDataSource';

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
      return token
        ? { authorization: `Bearer ${token}` }
        : ({} as Record<string, string>);
    },
  });
  container.register(dependencyTokens.authRepository, authRepository);
  const resumeRepository = new ResumeRepositoryImpl(
    new TrpcResumesDataSource(authenticatedClient),
  );
  container.register(dependencyTokens.resumeRepository, resumeRepository);
  container.register(
    dependencyTokens.onboardingRepository,
    new OnboardingRepositoryImpl(
      new TrpcOnboardingDataSource(authenticatedClient),
      resumeRepository,
    ),
  );
  const applicationRepository = new ApplicationRepositoryImpl(
    new TrpcApplicationsDataSource(authenticatedClient),
  );
  container.register(
    dependencyTokens.applicationRepository,
    applicationRepository,
  );
  container.register(
    dependencyTokens.listApplications,
    new ListApplications(applicationRepository),
  );
  container.register(
    dependencyTokens.createApplication,
    new CreateApplication(applicationRepository),
  );
  container.register(
    dependencyTokens.updateApplicationStatus,
    new UpdateApplicationStatus(applicationRepository),
  );
  container.register(
    dependencyTokens.deleteApplication,
    new DeleteApplication(applicationRepository),
  );
  container.register(
    dependencyTokens.getApplicationDetail,
    new GetApplicationDetail(applicationRepository),
  );
  container.register(
    dependencyTokens.listApplicationStages,
    new ListApplicationStages(applicationRepository),
  );
  container.register(
    dependencyTokens.getApplicationNote,
    new GetApplicationNote(applicationRepository),
  );
  container.register(
    dependencyTokens.listApplicationResources,
    new ListApplicationResources(applicationRepository),
  );
  container.register(
    dependencyTokens.updateApplicationResume,
    new UpdateApplicationResume(applicationRepository),
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

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
  CreateApplicationStage,
  GetApplicationStage,
  UpdateApplicationStage,
  DeleteApplicationStage,
} from '@/features/applications/domain/usecases/ApplicationDetailUseCases';
import { ResumeRepositoryImpl } from '@/features/resumes/data/repositories/ResumeRepositoryImpl';
import { TrpcResumesDataSource } from '@/features/resumes/data/datasources/TrpcResumesDataSource';
import { HttpResumeUploadDataSource } from '@/features/resumes/data/datasources/HttpResumeUploadDataSource';
import { ExpoResumeFilePicker } from '@/features/resumes/data/datasources/ExpoResumeFilePicker';
import { PickResumeFile } from '@/features/resumes/domain/usecases/PickResumeFile';
import { TrpcProfileDataSource } from '@/features/profile/data/datasources/TrpcProfileDataSource';
import { ProfileRepositoryImpl } from '@/features/profile/data/repositories/ProfileRepositoryImpl';
import { GetProfileDetail } from '@/features/profile/domain/usecases/GetProfileDetail';
import { ListProfileInterests } from '@/features/profile/domain/usecases/ListProfileInterests';
import { UpdateProfileRole } from '@/features/profile/domain/usecases/UpdateProfileRole';
import {
  CreateProfileExperience,
  DeleteProfileExperience,
  GetProfileExperience,
  ListProfileExperiences,
  UpdateProfileExperience,
} from '@/features/profile/domain/usecases/ProfileExperienceUseCases';
import {
  ListProfileSkills,
  ReplaceProfileSkills,
} from '@/features/profile/domain/usecases/ProfileSkillUseCases';
import { useResumeLibraryPreferences } from '@/features/resumes/presentation/stores/useResumeLibraryPreferences';
import { SessionCleanupRegistry } from '../session/SessionCleanupRegistry';
import { useOnboardingDraftStore } from '@/features/auth/presentation/onboarding/stores/useOnboardingDraftStore';

export function createAppContainer(): Container {
  const container = new Container();
  const sessionCleanupRegistry = new SessionCleanupRegistry();
  sessionCleanupRegistry.register(() =>
    useOnboardingDraftStore.getState().clear(),
  );
  sessionCleanupRegistry.register(() =>
    useResumeLibraryPreferences.getState().clear(),
  );
  container.register(
    dependencyTokens.sessionCleanupRegistry,
    sessionCleanupRegistry,
  );
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
    new HttpResumeUploadDataSource(),
  );
  container.register(dependencyTokens.resumeRepository, resumeRepository);
  container.register(
    dependencyTokens.pickResumeFile,
    new PickResumeFile(new ExpoResumeFilePicker()),
  );
  container.register(
    dependencyTokens.onboardingRepository,
    new OnboardingRepositoryImpl(
      new TrpcOnboardingDataSource(authenticatedClient),
      resumeRepository,
    ),
  );
  const profileRepository = new ProfileRepositoryImpl(
    new TrpcProfileDataSource(authenticatedClient),
  );
  container.register(
    dependencyTokens.getProfileDetail,
    new GetProfileDetail(profileRepository),
  );
  container.register(
    dependencyTokens.listProfileInterests,
    new ListProfileInterests(profileRepository),
  );
  container.register(
    dependencyTokens.updateProfileRole,
    new UpdateProfileRole(profileRepository),
  );
  container.register(
    dependencyTokens.listProfileExperiences,
    new ListProfileExperiences(profileRepository),
  );
  container.register(
    dependencyTokens.createProfileExperience,
    new CreateProfileExperience(profileRepository),
  );
  container.register(
    dependencyTokens.getProfileExperience,
    new GetProfileExperience(profileRepository),
  );
  container.register(
    dependencyTokens.updateProfileExperience,
    new UpdateProfileExperience(profileRepository),
  );
  container.register(
    dependencyTokens.deleteProfileExperience,
    new DeleteProfileExperience(profileRepository),
  );
  container.register(
    dependencyTokens.listProfileSkills,
    new ListProfileSkills(profileRepository),
  );
  container.register(
    dependencyTokens.replaceProfileSkills,
    new ReplaceProfileSkills(profileRepository),
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
  container.register(
    dependencyTokens.createApplicationStage,
    new CreateApplicationStage(applicationRepository),
  );
  container.register(
    dependencyTokens.getApplicationStage,
    new GetApplicationStage(applicationRepository),
  );
  container.register(
    dependencyTokens.updateApplicationStage,
    new UpdateApplicationStage(applicationRepository),
  );
  container.register(
    dependencyTokens.deleteApplicationStage,
    new DeleteApplicationStage(applicationRepository),
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

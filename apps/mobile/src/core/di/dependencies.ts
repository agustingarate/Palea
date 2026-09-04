import type { AiService } from '../ai/AiService';
import type { AuthRepository } from '@/features/auth/domain/repositories/AuthRepository';
import type { OnboardingRepository } from '@/features/auth/domain/repositories/OnboardingRepository';
import type { GetProjects } from '@/features/projects/domain/usecases/GetProjects';
import type { ApplicationRepository } from '@/features/applications/domain/repositories/ApplicationRepository';
import type { ListApplications } from '@/features/applications/domain/usecases/ListApplications';
import type { UpdateApplicationStatus } from '@/features/applications/domain/usecases/UpdateApplicationStatus';
import type { DeleteApplication } from '@/features/applications/domain/usecases/DeleteApplication';
import type { CreateApplication } from '@/features/applications/domain/usecases/CreateApplication';
import type { UpdateApplication } from '@/features/applications/domain/usecases/UpdateApplication';
import type {
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
import type { ResumeRepository } from '@/features/resumes/domain/repositories/ResumeRepository';
import type { PickResumeFile } from '@/features/resumes/domain/usecases/PickResumeFile';
import type { GetProfileDetail } from '@/features/profile/domain/usecases/GetProfileDetail';
import type { ListProfileInterests } from '@/features/profile/domain/usecases/ListProfileInterests';
import type { UpdateProfileRole } from '@/features/profile/domain/usecases/UpdateProfileRole';
import type {
  CreateProfileExperience,
  DeleteProfileExperience,
  GetProfileExperience,
  ListProfileExperiences,
  UpdateProfileExperience,
} from '@/features/profile/domain/usecases/ProfileExperienceUseCases';
import type {
  ListProfileSkills,
  ReplaceProfileSkills,
} from '@/features/profile/domain/usecases/ProfileSkillUseCases';
import { createToken } from './container';
import type { SessionCleanupRegistry } from '../session/SessionCleanupRegistry';
import type {
  JobDescriptionImagePicker,
  JobDescriptionImportPort,
} from '@/features/applications/domain/jobDescriptionImport';

export interface AppDependencies {
  getProjects: GetProjects;
  aiService: AiService;
  authRepository: AuthRepository;
  onboardingRepository: OnboardingRepository;
  resumeRepository: ResumeRepository;
  pickResumeFile: PickResumeFile;
  getProfileDetail: GetProfileDetail;
  listProfileInterests: ListProfileInterests;
  updateProfileRole: UpdateProfileRole;
  listProfileExperiences: ListProfileExperiences;
  createProfileExperience: CreateProfileExperience;
  getProfileExperience: GetProfileExperience;
  updateProfileExperience: UpdateProfileExperience;
  deleteProfileExperience: DeleteProfileExperience;
  listProfileSkills: ListProfileSkills;
  replaceProfileSkills: ReplaceProfileSkills;
  applicationRepository: ApplicationRepository;
  createApplication: CreateApplication;
  jobDescriptionImport: JobDescriptionImportPort;
  jobDescriptionImagePicker: JobDescriptionImagePicker;
  updateApplication: UpdateApplication;
  listApplications: ListApplications;
  updateApplicationStatus: UpdateApplicationStatus;
  deleteApplication: DeleteApplication;
  getApplicationDetail: GetApplicationDetail;
  listApplicationStages: ListApplicationStages;
  getApplicationNote: GetApplicationNote;
  listApplicationResources: ListApplicationResources;
  updateApplicationResume: UpdateApplicationResume;
  createApplicationStage: CreateApplicationStage;
  getApplicationStage: GetApplicationStage;
  updateApplicationStage: UpdateApplicationStage;
  deleteApplicationStage: DeleteApplicationStage;
  sessionCleanupRegistry: SessionCleanupRegistry;
}

export const dependencyTokens = {
  getProjects: createToken<GetProjects>('GetProjects'),
  aiService: createToken<AiService>('AiService'),
  authRepository: createToken<AuthRepository>('AuthRepository'),
  onboardingRepository: createToken<OnboardingRepository>(
    'OnboardingRepository',
  ),
  resumeRepository: createToken<ResumeRepository>('ResumeRepository'),
  pickResumeFile: createToken<PickResumeFile>('PickResumeFile'),
  getProfileDetail: createToken<GetProfileDetail>('GetProfileDetail'),
  listProfileInterests: createToken<ListProfileInterests>(
    'ListProfileInterests',
  ),
  updateProfileRole: createToken<UpdateProfileRole>('UpdateProfileRole'),
  listProfileExperiences: createToken<ListProfileExperiences>(
    'ListProfileExperiences',
  ),
  createProfileExperience: createToken<CreateProfileExperience>(
    'CreateProfileExperience',
  ),
  getProfileExperience: createToken<GetProfileExperience>(
    'GetProfileExperience',
  ),
  updateProfileExperience: createToken<UpdateProfileExperience>(
    'UpdateProfileExperience',
  ),
  deleteProfileExperience: createToken<DeleteProfileExperience>(
    'DeleteProfileExperience',
  ),
  listProfileSkills: createToken<ListProfileSkills>('ListProfileSkills'),
  replaceProfileSkills: createToken<ReplaceProfileSkills>(
    'ReplaceProfileSkills',
  ),
  applicationRepository: createToken<ApplicationRepository>(
    'ApplicationRepository',
  ),
  createApplication: createToken<CreateApplication>('CreateApplication'),
  jobDescriptionImport: createToken<JobDescriptionImportPort>(
    'JobDescriptionImport',
  ),
  jobDescriptionImagePicker: createToken<JobDescriptionImagePicker>(
    'JobDescriptionImagePicker',
  ),
  updateApplication: createToken<UpdateApplication>('UpdateApplication'),
  listApplications: createToken<ListApplications>('ListApplications'),
  updateApplicationStatus: createToken<UpdateApplicationStatus>(
    'UpdateApplicationStatus',
  ),
  deleteApplication: createToken<DeleteApplication>('DeleteApplication'),
  getApplicationDetail: createToken<GetApplicationDetail>(
    'GetApplicationDetail',
  ),
  listApplicationStages: createToken<ListApplicationStages>(
    'ListApplicationStages',
  ),
  getApplicationNote: createToken<GetApplicationNote>('GetApplicationNote'),
  listApplicationResources: createToken<ListApplicationResources>(
    'ListApplicationResources',
  ),
  updateApplicationResume: createToken<UpdateApplicationResume>(
    'UpdateApplicationResume',
  ),
  createApplicationStage: createToken<CreateApplicationStage>(
    'CreateApplicationStage',
  ),
  getApplicationStage: createToken<GetApplicationStage>('GetApplicationStage'),
  updateApplicationStage: createToken<UpdateApplicationStage>(
    'UpdateApplicationStage',
  ),
  deleteApplicationStage: createToken<DeleteApplicationStage>(
    'DeleteApplicationStage',
  ),
  sessionCleanupRegistry: createToken<SessionCleanupRegistry>(
    'SessionCleanupRegistry',
  ),
} as const;

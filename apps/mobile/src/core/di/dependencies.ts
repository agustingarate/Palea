import type { AiService } from '../ai/AiService';
import type { AuthRepository } from '@/features/auth/domain/repositories/AuthRepository';
import type { OnboardingRepository } from '@/features/auth/domain/repositories/OnboardingRepository';
import type { GetProjects } from '@/features/projects/domain/usecases/GetProjects';
import type { ApplicationRepository } from '@/features/applications/domain/repositories/ApplicationRepository';
import type { ListApplications } from '@/features/applications/domain/usecases/ListApplications';
import type { UpdateApplicationStatus } from '@/features/applications/domain/usecases/UpdateApplicationStatus';
import type { DeleteApplication } from '@/features/applications/domain/usecases/DeleteApplication';
import type { CreateApplication } from '@/features/applications/domain/usecases/CreateApplication';
import type {
  GetApplicationDetail,
  GetApplicationNote,
  ListApplicationResources,
  ListApplicationStages,
  UpdateApplicationResume,
} from '@/features/applications/domain/usecases/ApplicationDetailUseCases';
import type { ResumeRepository } from '@/features/resumes/domain/repositories/ResumeRepository';
import { createToken } from './container';

export interface AppDependencies {
  getProjects: GetProjects;
  aiService: AiService;
  authRepository: AuthRepository;
  onboardingRepository: OnboardingRepository;
  resumeRepository: ResumeRepository;
  applicationRepository: ApplicationRepository;
  createApplication: CreateApplication;
  listApplications: ListApplications;
  updateApplicationStatus: UpdateApplicationStatus;
  deleteApplication: DeleteApplication;
  getApplicationDetail: GetApplicationDetail;
  listApplicationStages: ListApplicationStages;
  getApplicationNote: GetApplicationNote;
  listApplicationResources: ListApplicationResources;
  updateApplicationResume: UpdateApplicationResume;
}

export const dependencyTokens = {
  getProjects: createToken<GetProjects>('GetProjects'),
  aiService: createToken<AiService>('AiService'),
  authRepository: createToken<AuthRepository>('AuthRepository'),
  onboardingRepository: createToken<OnboardingRepository>(
    'OnboardingRepository',
  ),
  resumeRepository: createToken<ResumeRepository>('ResumeRepository'),
  applicationRepository: createToken<ApplicationRepository>(
    'ApplicationRepository',
  ),
  createApplication: createToken<CreateApplication>('CreateApplication'),
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
} as const;

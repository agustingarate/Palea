import type { AiService } from '../ai/AiService';
import type { AuthRepository } from '@/features/auth/domain/repositories/AuthRepository';
import type { OnboardingRepository } from '@/features/auth/domain/repositories/OnboardingRepository';
import type { GetProjects } from '@/features/projects/domain/usecases/GetProjects';
import type { ApplicationRepository } from '@/features/applications/domain/repositories/ApplicationRepository';
import type { ListApplications } from '@/features/applications/domain/usecases/ListApplications';
import type { UpdateApplicationStatus } from '@/features/applications/domain/usecases/UpdateApplicationStatus';
import type { DeleteApplication } from '@/features/applications/domain/usecases/DeleteApplication';
import { createToken } from './container';

export interface AppDependencies {
  getProjects: GetProjects;
  aiService: AiService;
  authRepository: AuthRepository;
  onboardingRepository: OnboardingRepository;
  applicationRepository: ApplicationRepository;
  listApplications: ListApplications;
  updateApplicationStatus: UpdateApplicationStatus;
  deleteApplication: DeleteApplication;
}

export const dependencyTokens = {
  getProjects: createToken<GetProjects>('GetProjects'),
  aiService: createToken<AiService>('AiService'),
  authRepository: createToken<AuthRepository>('AuthRepository'),
  onboardingRepository: createToken<OnboardingRepository>(
    'OnboardingRepository',
  ),
  applicationRepository: createToken<ApplicationRepository>(
    'ApplicationRepository',
  ),
  listApplications: createToken<ListApplications>('ListApplications'),
  updateApplicationStatus: createToken<UpdateApplicationStatus>(
    'UpdateApplicationStatus',
  ),
  deleteApplication: createToken<DeleteApplication>('DeleteApplication'),
} as const;

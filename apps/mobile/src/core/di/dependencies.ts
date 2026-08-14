import type { AiService } from '../ai/AiService';
import type { GetProjects } from '@/features/projects/domain/usecases/GetProjects';
import { createToken } from './container';
import type { AuthRepository } from '@/features/auth/domain/AuthRepository';
import type { OnboardingRepository } from '@/features/auth/domain/OnboardingRepository';

export interface AppDependencies {
  getProjects: GetProjects;
  aiService: AiService;
  authRepository: AuthRepository;
  onboardingRepository: OnboardingRepository;
}

export const dependencyTokens = {
  getProjects: createToken<GetProjects>('GetProjects'),
  aiService: createToken<AiService>('AiService'),
  authRepository: createToken<AuthRepository>('AuthRepository'),
  onboardingRepository: createToken<OnboardingRepository>(
    'OnboardingRepository',
  ),
} as const;

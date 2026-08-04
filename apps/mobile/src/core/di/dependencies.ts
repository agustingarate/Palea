import type { AiService } from '../ai/AiService';
import type { GetProjects } from '@/features/projects/domain/usecases/GetProjects';
import { createToken } from './container';

export interface AppDependencies {
  getProjects: GetProjects;
  aiService: AiService;
}

export const dependencyTokens = {
  getProjects: createToken<GetProjects>('GetProjects'),
  aiService: createToken<AiService>('AiService'),
} as const;

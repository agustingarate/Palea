import type { Project } from '../entities/Project';

export interface ProjectRepository {
  list(signal?: AbortSignal): Promise<readonly Project[]>;
}

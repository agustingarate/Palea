import type { Project } from '../entities/Project';
import type { ProjectRepository } from '../repositories/ProjectRepository';

export class GetProjects {
  constructor(private readonly repository: ProjectRepository) {}
  execute(signal?: AbortSignal): Promise<readonly Project[]> {
    return this.repository.list(signal);
  }
}

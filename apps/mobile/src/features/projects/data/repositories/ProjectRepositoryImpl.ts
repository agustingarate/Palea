import { projectListSchema } from '@palea/contracts';
import type { Project } from '../../domain/entities/Project';
import type { ProjectRepository } from '../../domain/repositories/ProjectRepository';
import type { ProjectsDataSource } from '../datasources/ProjectsDataSource';

export class ProjectRepositoryImpl implements ProjectRepository {
  constructor(private readonly datasource: ProjectsDataSource) {}

  async list(signal?: AbortSignal): Promise<readonly Project[]> {
    const dtos = projectListSchema.parse(await this.datasource.list(signal));
    return dtos.map((dto) => ({ ...dto, updatedAt: new Date(dto.updatedAt) }));
  }
}

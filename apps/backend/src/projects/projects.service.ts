import { Injectable } from '@nestjs/common';
import type { ProjectDto } from '@palea/contracts';
import { demoProjects } from './demo-projects';

@Injectable()
export class ProjectsService {
  async list(input: {
    limit: number;
    signal?: AbortSignal;
  }): Promise<ProjectDto[]> {
    if (input.signal?.aborted) throw input.signal.reason;
    return demoProjects.slice(0, input.limit);
  }
}

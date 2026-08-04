import { Controller, Get, Inject } from '@nestjs/common';
import type { ProjectDto } from '@palea/contracts';
import { ProjectsService } from './projects.service';

@Controller('projects')
export class ProjectsController {
  constructor(
    @Inject(ProjectsService) private readonly projects: ProjectsService,
  ) {}
  @Get()
  list(): Promise<ProjectDto[]> {
    return this.projects.list({ limit: 20 });
  }
}

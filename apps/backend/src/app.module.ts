import { Module } from '@nestjs/common';
import { ProjectsController } from './projects/projects.controller';
import { ProjectsService } from './projects/projects.service';
import { HealthController } from './system/health.controller';
import { HealthService } from './system/health.service';

@Module({
  controllers: [HealthController, ProjectsController],
  providers: [HealthService, ProjectsService],
})
export class AppModule {}

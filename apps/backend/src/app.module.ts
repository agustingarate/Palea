import { Module } from '@nestjs/common';
import { ProjectsController } from './projects/projects.controller';
import { ProjectsService } from './projects/projects.service';
import { HealthController } from './system/health.controller';
import { HealthService } from './system/health.service';
import { AuthService } from './auth/auth.service';
import { AccountService } from './account/account.service';
import { ResumeService } from './account/resume.service';
import { ResumePdfValidator } from './account/resume-pdf.validator';
import { ResumeCleanupService } from './account/resume-cleanup.service';
import { PrismaService } from './database/prisma.service';
import { ApplicationsService } from './applications/applications.service';

@Module({
  controllers: [HealthController, ProjectsController],
  providers: [
    HealthService,
    ProjectsService,
    AuthService,
    AccountService,
    ResumeService,
    ResumePdfValidator,
    ResumeCleanupService,
    PrismaService,
    ApplicationsService,
  ],
})
export class AppModule {}

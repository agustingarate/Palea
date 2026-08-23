import { randomUUID } from 'node:crypto';
import { NestFactory } from '@nestjs/core';
import type { INestApplication } from '@nestjs/common';
import { appRouter, type PaleaTrpcContext } from '@palea/trpc';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import helmet from 'helmet';
import type { Request } from 'express';
import { AppModule } from './app.module';
import { environment } from './config/environment';
import { ProjectsService } from './projects/projects.service';
import { HealthService } from './system/health.service';
import { AuthService } from './auth/auth.service';
import { AccountService } from './account/account.service';
import { ResumeService } from './account/resume.service';
import { ApplicationsService } from './applications/applications.service';

export async function createApp(): Promise<INestApplication> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.use(helmet());
  app.enableCors({ origin: environment.corsOrigins });

  const health = app.get(HealthService);
  const projects = app.get(ProjectsService);
  const auth = app.get(AuthService);
  const account = app.get(AccountService);
  const resumes = app.get(ResumeService);
  const applications = app.get(ApplicationsService);
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.use(
    '/trpc',
    createExpressMiddleware({
      router: appRouter,
      createContext: ({ req }): Promise<PaleaTrpcContext> =>
        createContext(
          req,
          health,
          projects,
          auth,
          account,
          resumes,
          applications,
        ),
      onError: ({ error, path }) =>
        app
          .getHttpAdapter()
          .getInstance()
          .emit('palea:trpc-error', { code: error.code, path }),
    }),
  );
  return app;
}

async function createContext(
  req: Request,
  health: HealthService,
  projects: ProjectsService,
  auth: AuthService,
  account: AccountService,
  resumes: ResumeService,
  applications: ApplicationsService,
): Promise<PaleaTrpcContext> {
  const requestIdHeader = req.header('x-request-id');
  const identity = await auth.authenticate(req.header('authorization'));
  return {
    requestId:
      requestIdHeader && requestIdHeader.length <= 128
        ? requestIdHeader
        : randomUUID(),
    identity,
    services: {
      systemHealth: () => health.get(),
      listProjects: (input) => projects.list(input),
      getAccount: (requestIdentity) =>
        account.getMe(requestIdentity.subject, requestIdentity.email),
      completeRegistration: (subject, input) =>
        account.completeRegistration(subject, input),
      getOnboardingCatalog: (locale) => account.catalogs(locale),
      saveOnboardingProfile: (subject, input) =>
        account.saveProfile(subject, input),
      saveWorkExperience: (subject, input) =>
        account.saveWorkExperience(subject, input),
      saveSkills: (subject, input) => account.saveSkills(subject, input),
      completeOnboarding: (subject) => account.completeOnboarding(subject),
      reserveResumeUpload: (subject, input) => resumes.reserve(subject, input),
      confirmResumeUpload: (subject, resumeId) =>
        resumes.confirm(subject, resumeId),
      cancelResumeUpload: (subject, resumeId) =>
        resumes.cancel(subject, resumeId),
      listApplications: (subject, input) => applications.list(subject, input),
      updateApplicationStatus: (subject, input) =>
        applications.updateStatus(
          subject,
          input.applicationId,
          input.status,
          input.targetIndex,
        ),
      deleteApplication: (subject, applicationId) =>
        applications.remove(subject, applicationId),
    },
  };
}

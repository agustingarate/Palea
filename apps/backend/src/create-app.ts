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

export async function createApp(): Promise<INestApplication> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.use(helmet());
  app.enableCors({ origin: environment.corsOrigins });

  const health = app.get(HealthService);
  const projects = app.get(ProjectsService);
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.use(
    '/trpc',
    createExpressMiddleware({
      router: appRouter,
      createContext: ({ req }): PaleaTrpcContext =>
        createContext(req, health, projects),
      onError: ({ error, path }) =>
        app
          .getHttpAdapter()
          .getInstance()
          .emit('palea:trpc-error', { code: error.code, path }),
    }),
  );
  return app;
}

function createContext(
  req: Request,
  health: HealthService,
  projects: ProjectsService,
): PaleaTrpcContext {
  const requestIdHeader = req.header('x-request-id');
  return {
    requestId:
      requestIdHeader && requestIdHeader.length <= 128
        ? requestIdHeader
        : randomUUID(),
    identity: null,
    services: {
      systemHealth: () => health.get(),
      listProjects: (input) => projects.list(input),
    },
  };
}

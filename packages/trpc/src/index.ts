import {
  healthSchema,
  projectListSchema,
  type Health,
  type ProjectDto,
} from '@palea/contracts';
import { initTRPC } from '@trpc/server';
import { z } from 'zod';

export interface RequestIdentity {
  subject: string;
  roles: readonly string[];
}

export interface PaleaApiServices {
  systemHealth(): Promise<Health>;
  listProjects(input: {
    limit: number;
    signal?: AbortSignal;
  }): Promise<ProjectDto[]>;
}

export interface PaleaTrpcContext {
  requestId: string;
  identity: RequestIdentity | null;
  services: PaleaApiServices;
  signal?: AbortSignal;
}

const t = initTRPC.context<PaleaTrpcContext>().create({
  errorFormatter({ shape, ctx }) {
    return {
      ...shape,
      message:
        shape.data.code === 'INTERNAL_SERVER_ERROR'
          ? 'Internal server error'
          : shape.message,
      data: { ...shape.data, requestId: ctx?.requestId ?? 'unknown' },
    };
  },
});

const publicProcedure = t.procedure;

export const systemRouter = t.router({
  health: publicProcedure
    .input(z.object({}).optional())
    .output(healthSchema)
    .query(({ ctx }) => ctx.services.systemHealth()),
});

export const projectsRouter = t.router({
  list: publicProcedure
    .input(
      z
        .object({ limit: z.number().int().min(1).max(100).default(20) })
        .optional(),
    )
    .output(projectListSchema)
    .query(({ ctx, input }) =>
      ctx.services.listProjects({
        limit: input?.limit ?? 20,
        signal: ctx.signal,
      }),
    ),
});

export const appRouter = t.router({
  system: systemRouter,
  projects: projectsRouter,
});
export type AppRouter = typeof appRouter;

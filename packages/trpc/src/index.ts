import {
  healthSchema,
  accountProfileSchema,
  completeOnboardingInputSchema,
  completeRegistrationInputSchema,
  localeSchema,
  onboardingCatalogSchema,
  operationResultSchema,
  projectListSchema,
  reserveResumeUploadInputSchema,
  resumeIdInputSchema,
  resumeUploadReservationSchema,
  resumeListSchema,
  confirmResumeUploadInputSchema,
  saveProfileInputSchema,
  saveSkillsInputSchema,
  saveWorkExperienceInputSchema,
  type AccountProfile,
  type CompleteRegistrationInput,
  type Health,
  type ProjectDto,
  type Locale,
  type OnboardingCatalog,
  type ReserveResumeUploadInput,
  type SaveProfileInput,
  type SaveSkillsInput,
  type SaveWorkExperienceInput,
  applicationListInputSchema,
  applicationPageSchema,
  updateApplicationStatusInputSchema,
  createApplicationInputSchema,
  applicationSchema,
  applicationIdSchema,
  type ApplicationListInput,
  type ApplicationPage,
  type UpdateApplicationStatusInput,
  type CreateApplicationInput,
  type Application,
  type Resume,
  type ConfirmResumeUploadInput,
} from '@palea/contracts';
import { initTRPC, TRPCError } from '@trpc/server';
import { z } from 'zod';
import { AppError } from './AppError';
export { AppError } from './AppError';

export interface RequestIdentity {
  subject: string;
  email: string | null;
  roles: readonly string[];
}

export interface PaleaApiServices {
  systemHealth(): Promise<Health>;
  listProjects(input: {
    limit: number;
    signal?: AbortSignal;
  }): Promise<ProjectDto[]>;
  getAccount(identity: RequestIdentity): Promise<AccountProfile>;
  completeRegistration(
    subject: string,
    input: CompleteRegistrationInput,
  ): Promise<{ success: true }>;
  getOnboardingCatalog(locale: Locale): Promise<OnboardingCatalog>;
  saveOnboardingProfile(
    subject: string,
    input: SaveProfileInput,
  ): Promise<{ success: true }>;
  saveWorkExperience(
    subject: string,
    input: SaveWorkExperienceInput,
  ): Promise<{ success: true }>;
  saveSkills(
    subject: string,
    input: SaveSkillsInput,
  ): Promise<{ success: true }>;
  completeOnboarding(subject: string): Promise<{ success: true }>;
  reserveResumeUpload(
    subject: string,
    input: ReserveResumeUploadInput,
  ): Promise<{
    resumeId: string;
    path: string;
    signedUrl: string;
    expiresAt: string;
  }>;
  confirmResumeUpload(
    subject: string,
    input: ConfirmResumeUploadInput,
  ): Promise<{ success: true }>;
  listResumes(subject: string): Promise<Resume[]>;
  cancelResumeUpload(
    subject: string,
    resumeId: string,
  ): Promise<{ success: true }>;
  listApplications(
    subject: string,
    input: ApplicationListInput,
  ): Promise<ApplicationPage>;
  createApplication(
    subject: string,
    input: CreateApplicationInput,
  ): Promise<Application>;
  updateApplicationStatus(
    subject: string,
    input: UpdateApplicationStatusInput,
  ): Promise<{ success: true }>;
  deleteApplication(
    subject: string,
    applicationId: string,
  ): Promise<{ success: true }>;
}

export interface PaleaTrpcContext {
  requestId: string;
  identity: RequestIdentity | null;
  services: PaleaApiServices;
  signal?: AbortSignal;
}

const t = initTRPC.context<PaleaTrpcContext>().create({
  errorFormatter({ shape, ctx, error }) {
    return {
      ...shape,
      message:
        shape.data.code === 'INTERNAL_SERVER_ERROR'
          ? 'Internal server error'
          : shape.message,
      data: {
        ...shape.data,
        requestId: ctx?.requestId ?? 'unknown',
        appCode: error instanceof AppError ? error.appCode : undefined,
      },
    };
  },
});

const publicProcedure = t.procedure;
const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.identity) throw new TRPCError({ code: 'UNAUTHORIZED' });
  return next({ ctx: { ...ctx, identity: ctx.identity } });
});

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

export const accountRouter = t.router({
  me: protectedProcedure
    .input(z.object({}).optional())
    .output(accountProfileSchema)
    .query(({ ctx }) => ctx.services.getAccount(ctx.identity)),
  completeRegistration: protectedProcedure
    .input(completeRegistrationInputSchema)
    .output(operationResultSchema)
    .mutation(({ ctx, input }) =>
      ctx.services.completeRegistration(ctx.identity.subject, input),
    ),
});

export const catalogsRouter = t.router({
  onboarding: protectedProcedure
    .input(z.object({ locale: localeSchema.default('es') }))
    .output(onboardingCatalogSchema)
    .query(({ ctx, input }) => ctx.services.getOnboardingCatalog(input.locale)),
});

export const onboardingRouter = t.router({
  saveProfile: protectedProcedure
    .input(saveProfileInputSchema)
    .output(operationResultSchema)
    .mutation(({ ctx, input }) =>
      ctx.services.saveOnboardingProfile(ctx.identity.subject, input),
    ),
  saveWorkExperience: protectedProcedure
    .input(saveWorkExperienceInputSchema)
    .output(operationResultSchema)
    .mutation(({ ctx, input }) =>
      ctx.services.saveWorkExperience(ctx.identity.subject, input),
    ),
  saveSkills: protectedProcedure
    .input(saveSkillsInputSchema)
    .output(operationResultSchema)
    .mutation(({ ctx, input }) =>
      ctx.services.saveSkills(ctx.identity.subject, input),
    ),
  complete: protectedProcedure
    .input(completeOnboardingInputSchema)
    .output(operationResultSchema)
    .mutation(({ ctx }) =>
      ctx.services.completeOnboarding(ctx.identity.subject),
    ),
});

export const resumeRouter = t.router({
  list: protectedProcedure
    .input(z.object({}).optional())
    .output(resumeListSchema)
    .query(({ ctx }) => ctx.services.listResumes(ctx.identity.subject)),
  reserveUpload: protectedProcedure
    .input(reserveResumeUploadInputSchema)
    .output(resumeUploadReservationSchema)
    .mutation(({ ctx, input }) =>
      ctx.services.reserveResumeUpload(ctx.identity.subject, input),
    ),
  confirmUpload: protectedProcedure
    .input(confirmResumeUploadInputSchema)
    .output(operationResultSchema)
    .mutation(({ ctx, input }) =>
      ctx.services.confirmResumeUpload(ctx.identity.subject, input),
    ),
  cancelUpload: protectedProcedure
    .input(resumeIdInputSchema)
    .output(operationResultSchema)
    .mutation(({ ctx, input }) =>
      ctx.services.cancelResumeUpload(ctx.identity.subject, input.resumeId),
    ),
});

export const applicationsRouter = t.router({
  create: protectedProcedure
    .input(createApplicationInputSchema)
    .output(applicationSchema)
    .mutation(({ ctx, input }) =>
      ctx.services.createApplication(ctx.identity.subject, input),
    ),
  list: protectedProcedure
    .input(applicationListInputSchema)
    .output(applicationPageSchema)
    .query(({ ctx, input }) =>
      ctx.services.listApplications(ctx.identity.subject, input),
    ),
  updateStatus: protectedProcedure
    .input(updateApplicationStatusInputSchema)
    .output(operationResultSchema)
    .mutation(({ ctx, input }) =>
      ctx.services.updateApplicationStatus(ctx.identity.subject, input),
    ),
  delete: protectedProcedure
    .input(applicationIdSchema)
    .output(operationResultSchema)
    .mutation(({ ctx, input }) =>
      ctx.services.deleteApplication(ctx.identity.subject, input.applicationId),
    ),
});

export const appRouter = t.router({
  system: systemRouter,
  projects: projectsRouter,
  account: accountRouter,
  catalogs: catalogsRouter,
  onboarding: onboardingRouter,
  resume: resumeRouter,
  applications: applicationsRouter,
});
export type AppRouter = typeof appRouter;

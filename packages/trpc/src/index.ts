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
  resumeDownloadSchema,
  confirmResumeUploadInputSchema,
  deleteResumeInputSchema,
  type DeleteResumeInput,
  renameResumeInputSchema,
  resumeDeleteImpactSchema,
  resumeLibraryPolicySchema,
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
  applicationResumeInputSchema,
  applicationDetailSchema,
  applicationStagesSchema,
  applicationStageSchema,
  applicationStageIdSchema,
  createApplicationStageInputSchema,
  updateApplicationStageInputSchema,
  applicationNoteSchema,
  applicationResourcesSchema,
  type ApplicationListInput,
  type ApplicationPage,
  type UpdateApplicationStatusInput,
  type CreateApplicationInput,
  type Application,
  type ApplicationDetail,
  type ApplicationStage,
  type CreateApplicationStageInput,
  type UpdateApplicationStageInput,
  type ApplicationNote,
  type ApplicationResource,
  type Resume,
  type ConfirmResumeUploadInput,
  type ResumeLibraryPolicy,
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
  createResumePreview(
    subject: string,
    resumeId: string,
  ): Promise<{ signedUrl: string; expiresAt: string }>;
  createResumeDownload(
    subject: string,
    resumeId: string,
  ): Promise<{ signedUrl: string; expiresAt: string }>;
  cancelResumeUpload(
    subject: string,
    resumeId: string,
  ): Promise<{ success: true }>;
  getResumePolicy(subject: string): Promise<ResumeLibraryPolicy>;
  renameResume(
    subject: string,
    input: { resumeId: string; displayName: string },
  ): Promise<{ success: true }>;
  setPrimaryResume(
    subject: string,
    resumeId: string,
  ): Promise<{ success: true }>;
  getResumeDeleteImpact(
    subject: string,
    resumeId: string,
  ): Promise<{
    resumeId: string;
    applicationCount: number;
    isPrimary: boolean;
  }>;
  deleteResume(
    subject: string,
    input: DeleteResumeInput,
  ): Promise<{ success: true }>;
  listApplications(
    subject: string,
    input: ApplicationListInput,
  ): Promise<ApplicationPage>;
  createApplication(
    subject: string,
    input: CreateApplicationInput,
  ): Promise<Application>;
  getApplication(
    subject: string,
    applicationId: string,
  ): Promise<ApplicationDetail>;
  listApplicationStages(
    subject: string,
    applicationId: string,
  ): Promise<ApplicationStage[]>;
  createApplicationStage(
    subject: string,
    input: CreateApplicationStageInput,
  ): Promise<ApplicationStage>;
  getApplicationStage(
    subject: string,
    applicationId: string,
    stageId: string,
  ): Promise<ApplicationStage>;
  updateApplicationStage(
    subject: string,
    input: UpdateApplicationStageInput,
  ): Promise<ApplicationStage>;
  deleteApplicationStage(
    subject: string,
    applicationId: string,
    stageId: string,
  ): Promise<{ success: true }>;
  getApplicationNote(
    subject: string,
    applicationId: string,
  ): Promise<ApplicationNote | null>;
  listApplicationResources(
    subject: string,
    applicationId: string,
  ): Promise<ApplicationResource[]>;
  updateApplicationResume(
    subject: string,
    input: { applicationId: string; resumeId: string | null },
  ): Promise<{ success: true }>;
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
  createPreview: protectedProcedure
    .input(resumeIdInputSchema)
    .output(resumeDownloadSchema)
    .query(({ ctx, input }) =>
      ctx.services.createResumePreview(ctx.identity.subject, input.resumeId),
    ),
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
  createDownload: protectedProcedure
    .input(resumeIdInputSchema)
    .output(resumeDownloadSchema)
    .mutation(({ ctx, input }) =>
      ctx.services.createResumeDownload(ctx.identity.subject, input.resumeId),
    ),
  policy: protectedProcedure
    .input(z.object({}).optional())
    .output(resumeLibraryPolicySchema)
    .query(({ ctx }) => ctx.services.getResumePolicy(ctx.identity.subject)),
  rename: protectedProcedure
    .input(renameResumeInputSchema)
    .output(operationResultSchema)
    .mutation(({ ctx, input }) =>
      ctx.services.renameResume(ctx.identity.subject, input),
    ),
  setPrimary: protectedProcedure
    .input(resumeIdInputSchema)
    .output(operationResultSchema)
    .mutation(({ ctx, input }) =>
      ctx.services.setPrimaryResume(ctx.identity.subject, input.resumeId),
    ),
  deleteImpact: protectedProcedure
    .input(resumeIdInputSchema)
    .output(resumeDeleteImpactSchema)
    .query(({ ctx, input }) =>
      ctx.services.getResumeDeleteImpact(ctx.identity.subject, input.resumeId),
    ),
  delete: protectedProcedure
    .input(deleteResumeInputSchema)
    .output(operationResultSchema)
    .mutation(({ ctx, input }) =>
      ctx.services.deleteResume(ctx.identity.subject, input),
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
  get: protectedProcedure
    .input(applicationIdSchema)
    .output(applicationDetailSchema)
    .query(({ ctx, input }) =>
      ctx.services.getApplication(ctx.identity.subject, input.applicationId),
    ),
  listStages: protectedProcedure
    .input(applicationIdSchema)
    .output(applicationStagesSchema)
    .query(({ ctx, input }) =>
      ctx.services.listApplicationStages(
        ctx.identity.subject,
        input.applicationId,
      ),
    ),
  createStage: protectedProcedure
    .input(createApplicationStageInputSchema)
    .output(applicationStageSchema)
    .mutation(({ ctx, input }) =>
      ctx.services.createApplicationStage(ctx.identity.subject, input),
    ),
  getStage: protectedProcedure
    .input(applicationStageIdSchema)
    .output(applicationStageSchema)
    .query(({ ctx, input }) =>
      ctx.services.getApplicationStage(
        ctx.identity.subject,
        input.applicationId,
        input.stageId,
      ),
    ),
  updateStage: protectedProcedure
    .input(updateApplicationStageInputSchema)
    .output(applicationStageSchema)
    .mutation(({ ctx, input }) =>
      ctx.services.updateApplicationStage(ctx.identity.subject, input),
    ),
  deleteStage: protectedProcedure
    .input(applicationStageIdSchema)
    .output(operationResultSchema)
    .mutation(({ ctx, input }) =>
      ctx.services.deleteApplicationStage(
        ctx.identity.subject,
        input.applicationId,
        input.stageId,
      ),
    ),
  getNote: protectedProcedure
    .input(applicationIdSchema)
    .output(applicationNoteSchema.nullable())
    .query(({ ctx, input }) =>
      ctx.services.getApplicationNote(
        ctx.identity.subject,
        input.applicationId,
      ),
    ),
  listResources: protectedProcedure
    .input(applicationIdSchema)
    .output(applicationResourcesSchema)
    .query(({ ctx, input }) =>
      ctx.services.listApplicationResources(
        ctx.identity.subject,
        input.applicationId,
      ),
    ),
  updateResume: protectedProcedure
    .input(applicationResumeInputSchema)
    .output(operationResultSchema)
    .mutation(({ ctx, input }) =>
      ctx.services.updateApplicationResume(ctx.identity.subject, input),
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

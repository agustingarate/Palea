import { z } from 'zod';

export const projectStatusSchema = z.enum(['active', 'archived']);

export const projectDtoSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(120),
  company: z.string().min(1).max(120),
  status: projectStatusSchema,
  updatedAt: z.iso.datetime(),
});

export const projectListSchema = z.array(projectDtoSchema);
export const healthSchema = z.object({ status: z.literal('ok') });

export type ProjectDto = z.infer<typeof projectDtoSchema>;
export type ProjectStatus = z.infer<typeof projectStatusSchema>;
export type Health = z.infer<typeof healthSchema>;

export const localeSchema = z.enum(['es', 'en']);
export const experienceBandSchema = z.enum([
  'zero_to_one',
  'two_to_four',
  'five_to_eight',
  'over_eight',
]);
export const isoDateSchema = z.iso.date();
export const nationalitySchema = z.string().regex(/^[A-Z]{2}$/);
export const passwordSchema = z
  .string()
  .min(8)
  .regex(/[A-Z]/)
  .regex(/[a-z]/)
  .regex(/[0-9]/);
export const completeRegistrationInputSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  birthDate: isoDateSchema,
  nationality: nationalitySchema,
});
export const localizedCatalogItemSchema = z.object({
  id: z.uuid(),
  slug: z.string().min(1),
  label: z.string().min(1),
});
export const onboardingCatalogSchema = z.object({
  interests: z.array(localizedCatalogItemSchema),
  skills: z.array(localizedCatalogItemSchema),
});
export const saveProfileInputSchema = z.object({
  roleDescription: z.string().trim().min(2).max(500),
  experienceBand: experienceBandSchema,
  interestIds: z.array(z.uuid()).max(3),
});
export const saveWorkExperienceInputSchema = z
  .object({
    companyName: z.string().trim().min(1).max(120),
    role: z.string().trim().min(1).max(120),
    startedOn: isoDateSchema,
    endedOn: isoDateSchema.nullable(),
    isCurrent: z.boolean(),
  })
  .superRefine((value, ctx) => {
    if (value.isCurrent && value.endedOn !== null)
      ctx.addIssue({
        code: 'custom',
        path: ['endedOn'],
        message: 'Current work cannot have an end date',
      });
    if (value.endedOn && value.endedOn < value.startedOn)
      ctx.addIssue({
        code: 'custom',
        path: ['endedOn'],
        message: 'End date cannot be before start date',
      });
  });
export const saveSkillsInputSchema = z.object({
  skillIds: z.array(z.uuid()).max(10),
});
export const completeOnboardingInputSchema = z.object({ skipped: z.boolean() });
export const reserveResumeUploadInputSchema = z.object({
  displayName: z.string().trim().min(1).max(160),
  mimeType: z.literal('application/pdf'),
  sizeBytes: z
    .number()
    .int()
    .positive()
    .max(10 * 1024 * 1024),
});
export const resumeUploadReservationSchema = z.object({
  resumeId: z.uuid(),
  path: z.string().min(1),
  signedUrl: z.url(),
  expiresAt: z.iso.datetime(),
});
export const resumeIdInputSchema = z.object({ resumeId: z.uuid() });
export const accountProfileSchema = z.object({
  id: z.uuid(),
  email: z.email().nullable(),
  fullName: z.string().nullable(),
  birthDate: isoDateSchema.nullable(),
  nationality: nationalitySchema.nullable(),
  roleDescription: z.string().nullable(),
  experienceBand: experienceBandSchema.nullable(),
  interestIds: z.array(z.uuid()),
  skillIds: z.array(z.uuid()),
  hasWorkExperience: z.boolean(),
  primaryResume: z
    .object({
      id: z.uuid(),
      displayName: z.string(),
      sizeBytes: z.number().int(),
    })
    .nullable(),
  onboardingCompletedAt: z.iso.datetime().nullable(),
  missing: z.array(
    z.enum(['personal', 'profile', 'work_experience', 'skills', 'resume']),
  ),
});
export const operationResultSchema = z.object({ success: z.literal(true) });

export type Locale = z.infer<typeof localeSchema>;
export type ExperienceBand = z.infer<typeof experienceBandSchema>;
export type CompleteRegistrationInput = z.infer<
  typeof completeRegistrationInputSchema
>;
export type OnboardingCatalog = z.infer<typeof onboardingCatalogSchema>;
export type SaveProfileInput = z.infer<typeof saveProfileInputSchema>;
export type SaveWorkExperienceInput = z.infer<
  typeof saveWorkExperienceInputSchema
>;
export type SaveSkillsInput = z.infer<typeof saveSkillsInputSchema>;
export type ReserveResumeUploadInput = z.infer<
  typeof reserveResumeUploadInputSchema
>;
export type AccountProfile = z.infer<typeof accountProfileSchema>;

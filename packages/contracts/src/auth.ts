import { z } from 'zod';
import { isIsoAlpha2 } from './countries';

export const localeSchema = z.enum(['es', 'en']);
export const isoDateSchema = z.iso.date();
export const isoNationalitySchema: z.ZodType<string, string> = z
  .string()
  .regex(/^[A-Z]{2}$/)
  .refine((value) => isIsoAlpha2(value), 'nationality.invalid');
export const emailSchema = z.email();
export const fullNameSchema = z.string().trim().min(2).max(120);
export const passwordSchema = z
  .string()
  .min(8, 'password.minLength')
  .regex(/[A-Z]/, 'password.uppercase')
  .regex(/[a-z]/, 'password.lowercase')
  .regex(/[0-9]/, 'password.number');

export const completeRegistrationInputSchema = z.object({
  fullName: fullNameSchema,
  birthDate: isoDateSchema,
  nationality: isoNationalitySchema,
});

export const registrationInputSchema = completeRegistrationInputSchema
  .extend({
    email: emailSchema,
    password: passwordSchema,
    repeatPassword: z.string(),
  })
  .superRefine((value, context) => {
    if (value.password !== value.repeatPassword) {
      context.addIssue({
        code: 'custom',
        path: ['repeatPassword'],
        message: 'password.mismatch',
      });
    }
  });

export const experienceBandSchema = z.enum([
  'zero_to_one',
  'two_to_four',
  'five_to_eight',
  'over_eight',
]);

function uniqueIds(message: string) {
  return (value: readonly string[], context: z.RefinementCtx) => {
    if (value.length !== new Set(value).size) {
      context.addIssue({ code: 'custom', message });
    }
  };
}

export const saveProfileInputSchema = z
  .object({
    roleDescription: z.string().trim().min(2).max(500),
    experienceBand: experienceBandSchema,
    interestIds: z.array(z.uuid()).max(3, 'interests.max'),
  })
  .superRefine((value, context) =>
    uniqueIds('interests.duplicate')(value.interestIds, context),
  );

export const saveWorkExperienceInputSchema = z
  .object({
    companyName: z.string().trim().min(1).max(120),
    role: z.string().trim().min(1).max(120),
    startedOn: isoDateSchema,
    endedOn: isoDateSchema.nullable(),
    isCurrent: z.boolean(),
  })
  .superRefine((value, context) => {
    if (value.isCurrent && value.endedOn !== null) {
      context.addIssue({
        code: 'custom',
        path: ['endedOn'],
        message: 'work.endDateForCurrent',
      });
    }
    if (value.endedOn && value.endedOn < value.startedOn) {
      context.addIssue({
        code: 'custom',
        path: ['endedOn'],
        message: 'work.endBeforeStart',
      });
    }
  });

export const saveSkillsInputSchema = z
  .object({ skillIds: z.array(z.uuid()).max(10, 'skills.max') })
  .superRefine((value, context) =>
    uniqueIds('skills.duplicate')(value.skillIds, context),
  );

export const completeOnboardingInputSchema = z.object({});

export const reserveResumeUploadInputSchema = z.object({
  displayName: z.string().trim().min(1).max(160),
  mimeType: z.literal('application/pdf'),
  sizeBytes: z.number().int().positive(),
});

export const resumeIdInputSchema = z.object({ resumeId: z.uuid() });
export const resumeUploadReservationSchema = z.object({
  resumeId: z.uuid(),
  signedUrl: z.url(),
  expiresAt: z.iso.datetime(),
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

export const accountMissingFieldSchema = z.enum([
  'personal',
  'profile',
  'work_experience',
  'skills',
]);
export const accountProfileSchema = z.object({
  id: z.uuid(),
  email: emailSchema.nullable(),
  fullName: fullNameSchema.nullable(),
  birthDate: isoDateSchema.nullable(),
  nationality: isoNationalitySchema.nullable(),
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
  missing: z.array(accountMissingFieldSchema),
});

export const appErrorCodeSchema = z.enum([
  'auth.invalid_credentials',
  'auth.email_already_registered',
  'auth.oauth_cancelled',
  'auth.network',
  'auth.unknown',
  'account.profile_not_found',
  'account.personal_data_required',
  'account.invalid_nationality',
  'account.minimum_age',
  'account.invalid_interests',
  'account.invalid_skills',
  'profile.invalid_cursor',
  'profile.invalid_interests',
  'profile.invalid_skills',
  'profile.experience_not_found',
  'resume.expired',
  'resume.invalid_file',
  'resume.not_found',
  'resume.rate_limited',
  'resume.too_many_pending',
  'resume.cleanup_failed',
  'applications.not_found',
  'applications.date_required',
  'applications.future_date',
  'applications.invalid_resume',
  'applications.description_too_long',
]);
export const operationResultSchema = z.object({ success: z.literal(true) });

export function isAtLeastAge(
  birthDate: string,
  minimumAge: number,
  now = new Date(),
) {
  if (!isoDateSchema.safeParse(birthDate).success) return false;
  const birth = new Date(`${birthDate}T00:00:00.000Z`);
  const threshold = new Date(
    Date.UTC(
      now.getUTCFullYear() - minimumAge,
      now.getUTCMonth(),
      now.getUTCDate(),
    ),
  );
  return birth <= threshold;
}

export type Locale = z.infer<typeof localeSchema>;
export type CompleteRegistrationInput = z.infer<
  typeof completeRegistrationInputSchema
>;
export type RegistrationInput = z.infer<typeof registrationInputSchema>;
export type ExperienceBand = z.infer<typeof experienceBandSchema>;
export type SaveProfileInput = z.infer<typeof saveProfileInputSchema>;
export type SaveWorkExperienceInput = z.infer<
  typeof saveWorkExperienceInputSchema
>;
export type SaveSkillsInput = z.infer<typeof saveSkillsInputSchema>;
export type ReserveResumeUploadInput = z.infer<
  typeof reserveResumeUploadInputSchema
>;
export type OnboardingCatalog = z.infer<typeof onboardingCatalogSchema>;
export type AccountProfile = z.infer<typeof accountProfileSchema>;
export type AppErrorCode = z.infer<typeof appErrorCodeSchema>;

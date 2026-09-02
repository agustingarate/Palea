import { z } from 'zod';
import { experienceBandSchema, isoDateSchema, localeSchema } from './auth';

const uuidSchema = z.uuid();
const opaqueCursorSchema = z.string().min(1).max(512, 'profile.cursor.invalid');

function uniqueIds(message: string) {
  return (value: readonly string[], context: z.RefinementCtx) => {
    if (value.length !== new Set(value).size) {
      context.addIssue({ code: 'custom', message });
    }
  };
}

export const profileLocaleInputSchema = z.object({
  locale: localeSchema.default('es'),
});

export const localizedProfileCatalogItemSchema = z.object({
  id: uuidSchema,
  slug: z.string().min(1),
  label: z.string().min(1),
});

export const profileExperienceSchema = z.object({
  id: uuidSchema,
  companyName: z.string().min(1).max(120),
  role: z.string().min(1).max(120),
  startedOn: isoDateSchema,
  endedOn: isoDateSchema.nullable(),
  isCurrent: z.boolean(),
});

const profileExperienceFieldsSchema = z
  .object({
    companyName: z
      .string()
      .trim()
      .min(1, 'profile.experience.company.min')
      .max(120),
    role: z.string().trim().min(1, 'profile.experience.role.min').max(120),
    startedOn: isoDateSchema,
    endedOn: isoDateSchema.nullable(),
    isCurrent: z.boolean(),
  })
  .superRefine((value, context) => {
    if (value.isCurrent && value.endedOn !== null) {
      context.addIssue({
        code: 'custom',
        path: ['endedOn'],
        message: 'profile.experience.end_date_for_current',
      });
    }
    if (value.endedOn && value.endedOn < value.startedOn) {
      context.addIssue({
        code: 'custom',
        path: ['endedOn'],
        message: 'profile.experience.end_before_start',
      });
    }
  });

export const createProfileExperienceInputSchema = profileExperienceFieldsSchema;
export const updateProfileExperienceInputSchema =
  profileExperienceFieldsSchema.and(z.object({ experienceId: uuidSchema }));
export const profileExperienceIdInputSchema = z.object({
  experienceId: uuidSchema,
});
export const profileExperiencesInputSchema = z.object({
  cursor: opaqueCursorSchema.optional(),
});
export const profileExperiencesPageSchema = z.object({
  items: z.array(profileExperienceSchema).max(10),
  nextCursor: opaqueCursorSchema.nullable(),
});

export const updateProfileRoleInputSchema = z
  .object({
    roleDescription: z
      .string()
      .trim()
      .min(2, 'profile.role_description.min')
      .max(500, 'profile.role_description.max'),
    experienceBand: experienceBandSchema,
    interestIds: z.array(uuidSchema).max(3, 'profile.interests.max'),
  })
  .superRefine((value, context) =>
    uniqueIds('profile.interests.duplicate')(value.interestIds, context),
  );

export const replaceProfileSkillsInputSchema = z
  .object({
    skillIds: z.array(uuidSchema).max(10, 'profile.skills.max'),
  })
  .superRefine((value, context) =>
    uniqueIds('profile.skills.duplicate')(value.skillIds, context),
  );

export const profileCatalogInputSchema = z.object({
  locale: localeSchema.default('es'),
  search: z.string().trim().max(120, 'profile.catalog.search.max').optional(),
  cursor: opaqueCursorSchema.optional(),
});
export const profileCatalogPageSchema = z.object({
  items: z.array(localizedProfileCatalogItemSchema).max(20),
  nextCursor: opaqueCursorSchema.nullable(),
});

export const profileCompletionSectionSchema = z.enum([
  'role',
  'experience',
  'skills',
]);
export const profileCompletionSchema = z.object({
  missing: z.array(profileCompletionSectionSchema),
  nextSection: profileCompletionSectionSchema.nullable(),
});
export const profileDetailSchema = z.object({
  identity: z.object({
    id: uuidSchema,
    email: z.email().nullable(),
    fullName: z.string().min(2).max(120).nullable(),
    birthDate: isoDateSchema.nullable(),
    nationality: z.string().length(2).nullable(),
  }),
  role: z.object({
    description: z.string().nullable(),
    experienceBand: experienceBandSchema.nullable(),
    interests: z.array(localizedProfileCatalogItemSchema),
  }),
  experiences: z.array(profileExperienceSchema).max(3),
  skills: z.array(localizedProfileCatalogItemSchema),
  completion: profileCompletionSchema,
});

export type ProfileLocaleInput = z.infer<typeof profileLocaleInputSchema>;
export type ProfileDetail = z.infer<typeof profileDetailSchema>;
export type ProfileExperience = z.infer<typeof profileExperienceSchema>;
export type CreateProfileExperienceInput = z.infer<
  typeof createProfileExperienceInputSchema
>;
export type UpdateProfileExperienceInput = z.infer<
  typeof updateProfileExperienceInputSchema
>;
export type ProfileExperiencesInput = z.infer<
  typeof profileExperiencesInputSchema
>;
export type ProfileExperiencesPage = z.infer<
  typeof profileExperiencesPageSchema
>;
export type UpdateProfileRoleInput = z.infer<
  typeof updateProfileRoleInputSchema
>;
export type ReplaceProfileSkillsInput = z.infer<
  typeof replaceProfileSkillsInputSchema
>;
export type ProfileCatalogInput = z.infer<typeof profileCatalogInputSchema>;
export type ProfileCatalogPage = z.infer<typeof profileCatalogPageSchema>;

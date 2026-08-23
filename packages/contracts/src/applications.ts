import { z } from 'zod';

export const applicationStatusSchema = z.enum([
  'draft',
  'applied',
  'interview',
  'offer',
  'rejected',
]);
export const workModeSchema = z.enum([
  'remote',
  'hybrid',
  'onsite',
  'unspecified',
]);
export const applicationIdSchema = z.object({ applicationId: z.uuid() });
export const applicationListInputSchema = z.object({
  status: applicationStatusSchema,
  search: z.string().trim().max(120).optional(),
  cursor: z.uuid().optional(),
  limit: z.number().int().min(1).max(50).default(25),
});
export const applicationSchema = z.object({
  id: z.uuid(),
  companyName: z.string().min(1),
  role: z.string().min(1),
  appliedOn: z.iso.date(),
  status: applicationStatusSchema,
  workMode: workModeSchema,
  position: z.number().int().nonnegative(),
});
export const applicationPageSchema = z.object({
  items: z.array(applicationSchema),
  nextCursor: z.uuid().nullable(),
  total: z.number().int().nonnegative(),
});
export const updateApplicationStatusInputSchema = applicationIdSchema.extend({
  status: applicationStatusSchema,
  targetIndex: z.number().int().nonnegative().optional(),
});
export type Application = z.infer<typeof applicationSchema>;
export type ApplicationStatus = z.infer<typeof applicationStatusSchema>;
export type ApplicationPage = z.infer<typeof applicationPageSchema>;
export type ApplicationListInput = z.infer<typeof applicationListInputSchema>;
export type UpdateApplicationStatusInput = z.infer<
  typeof updateApplicationStatusInputSchema
>;

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

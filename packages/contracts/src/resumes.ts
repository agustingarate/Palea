import { z } from 'zod';

export const resumeSchema = z.object({
  id: z.uuid(),
  displayName: z.string().min(1).max(160),
  sizeBytes: z.number().int().positive(),
  isPrimary: z.boolean(),
  uploadedAt: z.iso.datetime().nullable(),
});

export const resumeListSchema = z.array(resumeSchema);

export const confirmResumeUploadInputSchema = z.object({
  resumeId: z.uuid(),
  makePrimary: z.boolean(),
});
export const resumeDownloadSchema = z.object({
  signedUrl: z.url(),
  expiresAt: z.iso.datetime(),
});

export type Resume = z.infer<typeof resumeSchema>;
export type ConfirmResumeUploadInput = z.infer<
  typeof confirmResumeUploadInputSchema
>;

import { z } from 'zod';

export const resumeSchema = z.object({
  id: z.uuid(),
  displayName: z.string().min(1).max(160),
  sizeBytes: z.number().int().positive(),
  isPrimary: z.boolean(),
  uploadedAt: z.iso.datetime().nullable(),
});

export const resumeListSchema = z.array(resumeSchema);

export const resumeLibraryPolicySchema = z.object({
  maxSizeBytes: z.number().int().positive(),
  maxResumes: z.number().int().positive(),
  usedResumes: z.number().int().min(0),
});

export const renameResumeInputSchema = z.object({
  resumeId: z.uuid(),
  displayName: z.string().trim().min(1).max(160),
});

export const resumeDeleteImpactSchema = z.object({
  resumeId: z.uuid(),
  applicationCount: z.number().int().min(0),
  isPrimary: z.boolean(),
});

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
export type ResumeLibraryPolicy = z.infer<typeof resumeLibraryPolicySchema>;

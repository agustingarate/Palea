import type {
  ConfirmResumeUploadInput,
  ReserveResumeUploadInput,
  Resume,
  ResumeLibraryPolicy,
  DeleteResumeInput,
} from '@palea/contracts';

export interface ResumesDataSource {
  list(): Promise<Resume[]>;
  reserve(
    input: ReserveResumeUploadInput,
  ): Promise<{ resumeId: string; signedUrl: string }>;
  confirm(input: ConfirmResumeUploadInput): Promise<void>;
  cancel(resumeId: string): Promise<void>;
  createDownload(resumeId: string): Promise<{ signedUrl: string }>;
  createPreview(
    resumeId: string,
  ): Promise<{ signedUrl: string; expiresAt: string }>;
  policy(): Promise<ResumeLibraryPolicy>;
  rename(resumeId: string, displayName: string): Promise<void>;
  setPrimary(resumeId: string): Promise<void>;
  deleteImpact(resumeId: string): Promise<{
    resumeId: string;
    applicationCount: number;
    isPrimary: boolean;
  }>;
  delete(input: DeleteResumeInput): Promise<void>;
}

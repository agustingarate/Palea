import type {
  ReserveResumeUploadInput,
  Resume,
  ResumeLibraryPolicy,
  ConfirmResumeUploadInput,
  DeleteResumeInput,
} from '@palea/contracts';

export interface ResumeUploadFile {
  name: string;
  mimeType: 'application/pdf';
  sizeBytes: number;
  readBytes(): Promise<Uint8Array>;
}

export interface ResumeRepository {
  list(): Promise<Resume[]>;
  upload(
    input: ReserveResumeUploadInput,
    file: ResumeUploadFile,
    options: {
      primaryMode: ConfirmResumeUploadInput['primaryMode'];
      onProgress?: (progress: number) => void;
    },
  ): Promise<string>;
  createDownload(resumeId: string): Promise<string>;
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

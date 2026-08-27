import type {
  ConfirmResumeUploadInput,
  ReserveResumeUploadInput,
  Resume,
} from '@palea/contracts';

export interface ResumesDataSource {
  list(): Promise<Resume[]>;
  reserve(
    input: ReserveResumeUploadInput,
  ): Promise<{ resumeId: string; signedUrl: string }>;
  confirm(input: ConfirmResumeUploadInput): Promise<void>;
  cancel(resumeId: string): Promise<void>;
  createDownload(resumeId: string): Promise<{ signedUrl: string }>;
}

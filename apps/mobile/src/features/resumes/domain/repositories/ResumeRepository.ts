import type { ReserveResumeUploadInput, Resume } from '@palea/contracts';

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
      makePrimary: boolean;
      onProgress?: (progress: number) => void;
    },
  ): Promise<string>;
}

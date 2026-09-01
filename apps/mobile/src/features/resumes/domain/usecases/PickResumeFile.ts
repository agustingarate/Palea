import type { ResumeLibraryPolicy } from '@palea/contracts';
import type { ResumeFilePicker } from '../repositories/ResumeFilePicker';
import type { ResumeUploadFile } from '../repositories/ResumeRepository';

export class PickResumeFile {
  constructor(private readonly picker: ResumeFilePicker) {}

  async execute(policy: ResumeLibraryPolicy): Promise<ResumeUploadFile | null> {
    if (policy.usedResumes >= policy.maxResumes)
      throw new Error('resume.library_full');
    const file = await this.picker.pick();
    if (!file) return null;
    // Reject known oversized files before reading them into memory.
    if (file.sizeBytes !== undefined && file.sizeBytes > policy.maxSizeBytes)
      throw new Error('resume.maxSize');
    if (file.mimeType && file.mimeType !== 'application/pdf')
      throw new Error('resume.invalidFile');
    const bytes = await file.readBytes();
    if (bytes.byteLength > policy.maxSizeBytes)
      throw new Error('resume.maxSize');
    if (String.fromCharCode(...bytes.slice(0, 5)) !== '%PDF-')
      throw new Error('resume.invalidFile');
    return {
      name: file.name,
      mimeType: 'application/pdf',
      sizeBytes: bytes.byteLength,
      readBytes: async () => bytes,
    };
  }
}

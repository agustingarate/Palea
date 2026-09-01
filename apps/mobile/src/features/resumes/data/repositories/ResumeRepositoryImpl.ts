import type {
  ResumeRepository,
  ResumeUploadFile,
} from '../../domain/repositories/ResumeRepository';
import type { ResumesDataSource } from '../datasources/ResumesDataSource';
import type { ResumeUploadDataSource } from '../datasources/ResumeUploadDataSource';

export class ResumeRepositoryImpl implements ResumeRepository {
  constructor(
    private readonly dataSource: ResumesDataSource,
    private readonly uploadDataSource: ResumeUploadDataSource,
  ) {}

  list() {
    return this.dataSource.list();
  }

  async upload(
    input: Parameters<ResumeRepository['upload']>[0],
    file: ResumeUploadFile,
    options: Parameters<ResumeRepository['upload']>[2],
  ) {
    const reservation = await this.dataSource.reserve(input);
    try {
      const bytes = await file.readBytes();
      const body = bytes.buffer.slice(
        bytes.byteOffset,
        bytes.byteOffset + bytes.byteLength,
      ) as ArrayBuffer;
      await this.uploadDataSource.put(
        reservation.signedUrl,
        body,
        file.mimeType,
        options.onProgress,
      );
      await this.dataSource.confirm({
        resumeId: reservation.resumeId,
        primaryMode: options.primaryMode,
      });
      options.onProgress?.(100);
      return reservation.resumeId;
    } catch (error) {
      await this.dataSource.cancel(reservation.resumeId).catch(() => undefined);
      throw error;
    }
  }

  async createDownload(resumeId: string) {
    const result = await this.dataSource.createDownload(resumeId);
    return result.signedUrl;
  }

  createPreview(resumeId: string) {
    return this.dataSource.createPreview(resumeId);
  }

  policy() {
    return this.dataSource.policy();
  }

  rename(resumeId: string, displayName: string) {
    return this.dataSource.rename(resumeId, displayName);
  }

  setPrimary(resumeId: string) {
    return this.dataSource.setPrimary(resumeId);
  }

  deleteImpact(resumeId: string) {
    return this.dataSource.deleteImpact(resumeId);
  }

  delete(input: Parameters<ResumeRepository['delete']>[0]) {
    return this.dataSource.delete(input);
  }
}

import type {
  ResumeRepository,
  ResumeUploadFile,
} from '../../domain/repositories/ResumeRepository';
import type { ResumesDataSource } from '../datasources/ResumesDataSource';

export class ResumeRepositoryImpl implements ResumeRepository {
  constructor(private readonly dataSource: ResumesDataSource) {}

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
      await putWithProgress(
        reservation.signedUrl,
        body,
        file.mimeType,
        options.onProgress,
      );
      await this.dataSource.confirm({
        resumeId: reservation.resumeId,
        makePrimary: options.makePrimary,
      });
      options.onProgress?.(100);
      return reservation.resumeId;
    } catch (error) {
      await this.dataSource.cancel(reservation.resumeId).catch(() => undefined);
      throw error;
    }
  }
}

function putWithProgress(
  url: string,
  body: ArrayBuffer,
  mimeType: string,
  onProgress?: (progress: number) => void,
) {
  return new Promise<void>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open('PUT', url);
    request.setRequestHeader('content-type', mimeType);
    request.timeout = 30_000;
    request.upload.onprogress = (event) => {
      if (event.lengthComputable)
        onProgress?.(Math.round((event.loaded / event.total) * 95));
    };
    request.onload = () =>
      request.status >= 200 && request.status < 300
        ? resolve()
        : reject(new Error('resume.uploadFailed'));
    request.onerror = request.ontimeout = () =>
      reject(new Error('resume.uploadFailed'));
    request.send(body);
  });
}

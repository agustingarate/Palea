import {
  confirmResumeUploadInputSchema,
  reserveResumeUploadInputSchema,
  resumeListSchema,
  resumeDownloadSchema,
  resumeIdInputSchema,
  type ConfirmResumeUploadInput,
  type ReserveResumeUploadInput,
} from '@palea/contracts';
import type { PaleaApiClient } from '@palea/api-client';
import type { ResumesDataSource } from './ResumesDataSource';

export class TrpcResumesDataSource implements ResumesDataSource {
  constructor(private readonly client: PaleaApiClient) {}

  async list() {
    return resumeListSchema.parse(await this.client.resume.list.query());
  }

  async reserve(input: ReserveResumeUploadInput) {
    const reservation = await this.client.resume.reserveUpload.mutate(
      reserveResumeUploadInputSchema.parse(input),
    );
    return {
      resumeId: reservation.resumeId,
      signedUrl: reservation.signedUrl,
    };
  }

  async confirm(input: ConfirmResumeUploadInput) {
    await this.client.resume.confirmUpload.mutate(
      confirmResumeUploadInputSchema.parse(input),
    );
  }

  async cancel(resumeId: string) {
    await this.client.resume.cancelUpload.mutate({ resumeId });
  }

  async createDownload(resumeId: string) {
    const result = resumeDownloadSchema.parse(
      await this.client.resume.createDownload.mutate(
        resumeIdInputSchema.parse({ resumeId }),
      ),
    );
    return { signedUrl: result.signedUrl };
  }
}

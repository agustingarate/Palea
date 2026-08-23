import {
  applicationIdSchema,
  applicationListInputSchema,
  applicationPageSchema,
  type ApplicationStatus,
  updateApplicationStatusInputSchema,
} from '@palea/contracts';
import type { PaleaApiClient } from '@palea/api-client';
import type { ApplicationsDataSource } from './ApplicationsDataSource';

/** tRPC boundary for the applications feature. */
export class TrpcApplicationsDataSource implements ApplicationsDataSource {
  constructor(private readonly client: PaleaApiClient) {}

  async list(
    status: ApplicationStatus,
    options: { search?: string; cursor?: string } = {},
  ) {
    const input = applicationListInputSchema.parse({ status, ...options });
    return applicationPageSchema.parse(
      await this.client.applications.list.query(input),
    );
  }

  async updateStatus(
    applicationId: string,
    status: ApplicationStatus,
    targetIndex?: number,
  ) {
    const input = updateApplicationStatusInputSchema.parse({
      applicationId,
      status,
      ...(targetIndex === undefined ? {} : { targetIndex }),
    });
    await this.client.applications.updateStatus.mutate(input);
  }

  async remove(applicationId: string) {
    await this.client.applications.delete.mutate(
      applicationIdSchema.parse({ applicationId }),
    );
  }
}

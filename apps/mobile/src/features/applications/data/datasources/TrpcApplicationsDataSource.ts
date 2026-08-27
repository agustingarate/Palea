import {
  applicationIdSchema,
  applicationListInputSchema,
  applicationPageSchema,
  applicationSchema,
  applicationDetailSchema,
  applicationStagesSchema,
  applicationNoteSchema,
  applicationResourcesSchema,
  applicationResumeInputSchema,
  createApplicationInputSchema,
  type CreateApplicationInput,
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

  async create(input: CreateApplicationInput) {
    return applicationSchema.parse(
      await this.client.applications.create.mutate(
        createApplicationInputSchema.parse(input),
      ),
    );
  }

  async get(applicationId: string) {
    return applicationDetailSchema.parse(
      await this.client.applications.get.query(
        applicationIdSchema.parse({ applicationId }),
      ),
    );
  }

  async listStages(applicationId: string) {
    return applicationStagesSchema.parse(
      await this.client.applications.listStages.query(
        applicationIdSchema.parse({ applicationId }),
      ),
    );
  }

  async getNote(applicationId: string) {
    return applicationNoteSchema
      .nullable()
      .parse(
        await this.client.applications.getNote.query(
          applicationIdSchema.parse({ applicationId }),
        ),
      );
  }

  async listResources(applicationId: string) {
    return applicationResourcesSchema.parse(
      await this.client.applications.listResources.query(
        applicationIdSchema.parse({ applicationId }),
      ),
    );
  }

  async updateResume(applicationId: string, resumeId: string | null) {
    await this.client.applications.updateResume.mutate(
      applicationResumeInputSchema.parse({ applicationId, resumeId }),
    );
  }

  async updateStatus(
    applicationId: string,
    status: ApplicationStatus,
    targetIndex?: number,
    appliedOn?: string,
    timeZone?: string,
  ) {
    const input = updateApplicationStatusInputSchema.parse({
      applicationId,
      status,
      ...(targetIndex === undefined ? {} : { targetIndex }),
      ...(appliedOn === undefined ? {} : { appliedOn }),
      timeZone: timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
    await this.client.applications.updateStatus.mutate(input);
  }

  async remove(applicationId: string) {
    await this.client.applications.delete.mutate(
      applicationIdSchema.parse({ applicationId }),
    );
  }
}

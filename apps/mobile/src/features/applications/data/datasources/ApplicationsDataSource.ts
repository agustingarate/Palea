import type {
  Application,
  ApplicationPage,
  ApplicationStatus,
  CreateApplicationInput,
} from '@palea/contracts';

export interface ApplicationsDataSource {
  list(
    status: ApplicationStatus,
    options?: { search?: string; cursor?: string },
  ): Promise<ApplicationPage>;
  create(input: CreateApplicationInput): Promise<Application>;
  updateStatus(
    applicationId: string,
    status: ApplicationStatus,
    targetIndex?: number,
    appliedOn?: string,
    timeZone?: string,
  ): Promise<void>;
  remove(applicationId: string): Promise<void>;
}

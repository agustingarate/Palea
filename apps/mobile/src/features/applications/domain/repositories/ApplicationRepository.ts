import type {
  Application,
  ApplicationPage,
  ApplicationStatus,
  CreateApplicationInput,
} from '../entities/Application';
export interface ApplicationRepository {
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

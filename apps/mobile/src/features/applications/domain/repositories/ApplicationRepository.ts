import type {
  ApplicationPage,
  ApplicationStatus,
} from '../entities/Application';
export interface ApplicationRepository {
  list(
    status: ApplicationStatus,
    options?: { search?: string; cursor?: string },
  ): Promise<ApplicationPage>;
  updateStatus(
    applicationId: string,
    status: ApplicationStatus,
    targetIndex?: number,
  ): Promise<void>;
  remove(applicationId: string): Promise<void>;
}

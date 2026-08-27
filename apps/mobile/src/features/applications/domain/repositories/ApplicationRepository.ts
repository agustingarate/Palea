import type {
  Application,
  ApplicationPage,
  ApplicationStatus,
  CreateApplicationInput,
  ApplicationDetail,
  ApplicationStage,
  ApplicationNote,
  ApplicationResource,
} from '../entities/Application';
export interface ApplicationRepository {
  list(
    status: ApplicationStatus,
    options?: { search?: string; cursor?: string },
  ): Promise<ApplicationPage>;
  create(input: CreateApplicationInput): Promise<Application>;
  get(applicationId: string): Promise<ApplicationDetail>;
  listStages(applicationId: string): Promise<ApplicationStage[]>;
  getNote(applicationId: string): Promise<ApplicationNote | null>;
  listResources(applicationId: string): Promise<ApplicationResource[]>;
  updateResume(applicationId: string, resumeId: string | null): Promise<void>;
  updateStatus(
    applicationId: string,
    status: ApplicationStatus,
    targetIndex?: number,
    appliedOn?: string,
    timeZone?: string,
  ): Promise<void>;
  remove(applicationId: string): Promise<void>;
}

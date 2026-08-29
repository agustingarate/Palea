import type { ApplicationRepository } from '../../domain/repositories/ApplicationRepository';
import type {
  Application,
  ApplicationPage,
  ApplicationStatus,
  CreateApplicationInput,
  ApplicationDetail,
  ApplicationStage,
  ApplicationNote,
  ApplicationResource,
} from '../../domain/entities/Application';
import type { ApplicationsDataSource } from '../datasources/ApplicationsDataSource';

export class ApplicationRepositoryImpl implements ApplicationRepository {
  constructor(private readonly dataSource: ApplicationsDataSource) {}
  async list(
    status: ApplicationStatus,
    options: { search?: string; cursor?: string } = {},
  ): Promise<ApplicationPage> {
    return this.dataSource.list(status, options);
  }
  async create(input: CreateApplicationInput): Promise<Application> {
    return this.dataSource.create(input);
  }
  get(applicationId: string): Promise<ApplicationDetail> {
    return this.dataSource.get(applicationId);
  }
  listStages(applicationId: string): Promise<ApplicationStage[]> {
    return this.dataSource.listStages(applicationId);
  }
  getNote(applicationId: string): Promise<ApplicationNote | null> {
    return this.dataSource.getNote(applicationId);
  }
  listResources(applicationId: string): Promise<ApplicationResource[]> {
    return this.dataSource.listResources(applicationId);
  }
  async updateResume(applicationId: string, resumeId: string | null) {
    await this.dataSource.updateResume(applicationId, resumeId);
  }
  async updateStatus(
    applicationId: string,
    status: ApplicationStatus,
    targetIndex?: number,
    appliedOn?: string,
    timeZone?: string,
  ): Promise<void> {
    await this.dataSource.updateStatus(
      applicationId,
      status,
      targetIndex,
      appliedOn,
      timeZone,
    );
  }
  async remove(applicationId: string): Promise<void> {
    await this.dataSource.remove(applicationId);
  }
}

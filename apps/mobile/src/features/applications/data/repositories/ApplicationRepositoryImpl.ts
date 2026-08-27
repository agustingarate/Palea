import type { ApplicationRepository } from '../../domain/repositories/ApplicationRepository';
import type {
  Application,
  ApplicationPage,
  ApplicationStatus,
  CreateApplicationInput,
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

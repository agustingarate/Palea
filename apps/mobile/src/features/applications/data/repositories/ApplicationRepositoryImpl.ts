import type { ApplicationRepository } from '../../domain/repositories/ApplicationRepository';
import type {
  ApplicationPage,
  ApplicationStatus,
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
  async updateStatus(
    applicationId: string,
    status: ApplicationStatus,
    targetIndex?: number,
  ): Promise<void> {
    await this.dataSource.updateStatus(applicationId, status, targetIndex);
  }
  async remove(applicationId: string): Promise<void> {
    await this.dataSource.remove(applicationId);
  }
}

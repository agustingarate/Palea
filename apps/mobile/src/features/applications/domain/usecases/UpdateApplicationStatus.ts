import type { ApplicationStatus } from '../entities/Application';
import type { ApplicationRepository } from '../repositories/ApplicationRepository';

export class UpdateApplicationStatus {
  constructor(private readonly repository: ApplicationRepository) {}

  execute(
    applicationId: string,
    status: ApplicationStatus,
    targetIndex?: number,
  ): Promise<void> {
    return targetIndex === undefined
      ? this.repository.updateStatus(applicationId, status)
      : this.repository.updateStatus(applicationId, status, targetIndex);
  }
}

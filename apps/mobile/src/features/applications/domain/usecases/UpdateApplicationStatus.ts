import type { ApplicationStatus } from '../entities/Application';
import type { ApplicationRepository } from '../repositories/ApplicationRepository';

export class UpdateApplicationStatus {
  constructor(private readonly repository: ApplicationRepository) {}

  execute(
    applicationId: string,
    status: ApplicationStatus,
    targetIndex?: number,
    appliedOn?: string,
    timeZone?: string,
  ): Promise<void> {
    return this.repository.updateStatus(
      applicationId,
      status,
      targetIndex,
      appliedOn,
      timeZone,
    );
  }
}

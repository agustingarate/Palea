import type {
  ApplicationPage,
  ApplicationStatus,
} from '../entities/Application';
import type { ApplicationRepository } from '../repositories/ApplicationRepository';

export class ListApplications {
  constructor(private readonly repository: ApplicationRepository) {}

  execute(
    status: ApplicationStatus,
    options?: { search?: string; cursor?: string },
  ): Promise<ApplicationPage> {
    return this.repository.list(status, options);
  }
}

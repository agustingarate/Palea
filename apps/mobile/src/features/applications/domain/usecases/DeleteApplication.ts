import type { ApplicationRepository } from '../repositories/ApplicationRepository';

export class DeleteApplication {
  constructor(private readonly repository: ApplicationRepository) {}

  execute(applicationId: string): Promise<void> {
    return this.repository.remove(applicationId);
  }
}

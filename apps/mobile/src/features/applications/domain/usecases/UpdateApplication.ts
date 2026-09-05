import type { UpdateApplicationInput } from '../entities/Application';
import type { ApplicationRepository } from '../repositories/ApplicationRepository';

export class UpdateApplication {
  constructor(private readonly repository: ApplicationRepository) {}

  execute(input: UpdateApplicationInput) {
    return this.repository.update(input);
  }
}

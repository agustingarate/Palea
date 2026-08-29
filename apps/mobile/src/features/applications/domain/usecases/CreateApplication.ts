import type { CreateApplicationInput } from '../entities/Application';
import type { ApplicationRepository } from '../repositories/ApplicationRepository';

export class CreateApplication {
  constructor(private readonly repository: ApplicationRepository) {}

  execute(input: CreateApplicationInput) {
    return this.repository.create(input);
  }
}

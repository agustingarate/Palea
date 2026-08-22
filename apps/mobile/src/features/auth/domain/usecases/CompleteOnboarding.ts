import type { OnboardingRepository } from '../repositories/OnboardingRepository';

export class CompleteOnboarding {
  constructor(private readonly repository: OnboardingRepository) {}

  execute() {
    return this.repository.completeOnboarding();
  }
}

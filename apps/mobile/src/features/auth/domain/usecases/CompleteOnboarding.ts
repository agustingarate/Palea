import type { OnboardingRepository } from '../repositories/OnboardingRepository';

export class CompleteOnboarding {
  constructor(private readonly repository: OnboardingRepository) {}

  execute(skipped: boolean) {
    return this.repository.completeOnboarding({ skipped });
  }
}

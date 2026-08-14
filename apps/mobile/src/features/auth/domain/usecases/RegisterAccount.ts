import type { CompleteRegistrationInput } from '@palea/contracts';
import type { AuthRepository } from '../repositories/AuthRepository';
import type { OnboardingRepository } from '../repositories/OnboardingRepository';

export class RegisterAccount {
  constructor(
    private readonly auth: AuthRepository,
    private readonly onboarding: OnboardingRepository,
  ) {}

  async execute(input: CompleteRegistrationInput & { email: string; password: string }) {
    await this.auth.signUp({ email: input.email, password: input.password, fullName: input.fullName });
    await this.onboarding.completeRegistration({
      fullName: input.fullName,
      birthDate: input.birthDate,
      nationality: input.nationality,
    });
  }
}

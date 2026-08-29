import type {
  AccountProfile,
  CompleteRegistrationInput,
  Locale,
  OnboardingCatalog,
  SaveProfileInput,
  SaveSkillsInput,
  SaveWorkExperienceInput,
} from '@palea/contracts';

export interface OnboardingDataSource {
  getAccount(): Promise<AccountProfile>;
  completeRegistration(input: CompleteRegistrationInput): Promise<void>;
  getCatalog(locale: Locale): Promise<OnboardingCatalog>;
  saveProfile(input: SaveProfileInput): Promise<void>;
  saveWorkExperience(input: SaveWorkExperienceInput): Promise<void>;
  saveSkills(input: SaveSkillsInput): Promise<void>;
  completeOnboarding(): Promise<void>;
}

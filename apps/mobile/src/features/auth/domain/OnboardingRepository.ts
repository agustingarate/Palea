import type {
  AccountProfile,
  CompleteRegistrationInput,
  Locale,
  OnboardingCatalog,
  ReserveResumeUploadInput,
  SaveProfileInput,
  SaveSkillsInput,
  SaveWorkExperienceInput,
} from '@palea/contracts';

export interface OnboardingRepository {
  me(): Promise<AccountProfile>;
  completeRegistration(input: CompleteRegistrationInput): Promise<void>;
  catalogs(locale: Locale): Promise<OnboardingCatalog>;
  saveProfile(input: SaveProfileInput): Promise<void>;
  saveWorkExperience(input: SaveWorkExperienceInput): Promise<void>;
  saveSkills(input: SaveSkillsInput): Promise<void>;
  complete(skipped: boolean): Promise<void>;
  uploadResume(
    input: ReserveResumeUploadInput & { bytes: Blob },
  ): Promise<void>;
}

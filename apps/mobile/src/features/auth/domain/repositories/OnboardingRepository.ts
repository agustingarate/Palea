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
import type { ResumeUploadFile } from '@/features/resumes/domain/repositories/ResumeRepository';

export type { ResumeUploadFile };

export interface OnboardingRepository {
  getAccount(): Promise<AccountProfile>;
  completeRegistration(input: CompleteRegistrationInput): Promise<void>;
  getCatalog(locale: Locale): Promise<OnboardingCatalog>;
  saveProfile(input: SaveProfileInput): Promise<void>;
  saveWorkExperience(input: SaveWorkExperienceInput): Promise<void>;
  saveSkills(input: SaveSkillsInput): Promise<void>;
  completeOnboarding(): Promise<void>;
  uploadResume(
    input: ReserveResumeUploadInput,
    file: ResumeUploadFile,
    onProgress?: (progress: number) => void,
  ): Promise<void>;
}

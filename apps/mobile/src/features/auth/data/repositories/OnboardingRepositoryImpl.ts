import type {
  OnboardingRepository,
  ResumeUploadFile,
} from '../../domain/repositories/OnboardingRepository';
import type { ResumeRepository } from '@/features/resumes/domain/repositories/ResumeRepository';
import type { OnboardingDataSource } from '../datasources/OnboardingDataSource';

export class OnboardingRepositoryImpl implements OnboardingRepository {
  constructor(
    private readonly dataSource: OnboardingDataSource,
    private readonly resumes: ResumeRepository,
  ) {}
  getAccount() {
    return this.dataSource.getAccount();
  }
  completeRegistration(
    input: Parameters<OnboardingRepository['completeRegistration']>[0],
  ) {
    return this.dataSource.completeRegistration(input);
  }
  getCatalog(locale: Parameters<OnboardingRepository['getCatalog']>[0]) {
    return this.dataSource.getCatalog(locale);
  }
  saveProfile(input: Parameters<OnboardingRepository['saveProfile']>[0]) {
    return this.dataSource.saveProfile(input);
  }
  saveWorkExperience(
    input: Parameters<OnboardingRepository['saveWorkExperience']>[0],
  ) {
    return this.dataSource.saveWorkExperience(input);
  }
  saveSkills(input: Parameters<OnboardingRepository['saveSkills']>[0]) {
    return this.dataSource.saveSkills(input);
  }
  completeOnboarding() {
    return this.dataSource.completeOnboarding();
  }
  async uploadResume(
    input: Parameters<OnboardingRepository['uploadResume']>[0],
    file: ResumeUploadFile,
    onProgress?: (progress: number) => void,
  ) {
    await this.resumes.upload(input, file, { makePrimary: true, onProgress });
  }
}

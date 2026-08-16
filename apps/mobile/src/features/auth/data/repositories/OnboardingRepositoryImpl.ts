import type {
  OnboardingRepository,
  ResumeUploadFile,
} from '../../domain/repositories/OnboardingRepository';
import type { OnboardingDataSource } from '../datasources/OnboardingDataSource';

export class OnboardingRepositoryImpl implements OnboardingRepository {
  constructor(private readonly dataSource: OnboardingDataSource) {}
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
  completeOnboarding(input: { skipped: boolean }) {
    return this.dataSource.completeOnboarding(input);
  }
  async uploadResume(
    input: Parameters<OnboardingRepository['uploadResume']>[0],
    file: ResumeUploadFile,
    onProgress?: (progress: number) => void,
  ) {
    onProgress?.(10);
    const reservation = await this.dataSource.reserveResume(input);
    try {
      onProgress?.(25);
      const bytes = await file.readBytes();
      const body = bytes.buffer.slice(
        bytes.byteOffset,
        bytes.byteOffset + bytes.byteLength,
      ) as ArrayBuffer;
      onProgress?.(45);
      const response = await fetch(reservation.signedUrl, {
        method: 'PUT',
        headers: { 'content-type': file.mimeType },
        body: new Blob([body]),
      });
      if (!response.ok) throw new Error('resume.uploadFailed');
      onProgress?.(85);
      await this.dataSource.confirmResume(reservation.resumeId);
      onProgress?.(100);
    } catch (error) {
      await this.dataSource
        .cancelResume(reservation.resumeId)
        .catch(() => undefined);
      throw error;
    }
  }
}

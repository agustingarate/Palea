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
  completeOnboarding() {
    return this.dataSource.completeOnboarding();
  }
  async uploadResume(
    input: Parameters<OnboardingRepository['uploadResume']>[0],
    file: ResumeUploadFile,
    onProgress?: (progress: number) => void,
  ) {
    const reservation = await this.dataSource.reserveResume(input);
    try {
      const bytes = await file.readBytes();
      const body = bytes.buffer.slice(
        bytes.byteOffset,
        bytes.byteOffset + bytes.byteLength,
      ) as ArrayBuffer;
      await putWithProgress(
        reservation.signedUrl,
        body,
        file.mimeType,
        onProgress,
      );
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

function putWithProgress(
  url: string,
  body: ArrayBuffer,
  mimeType: string,
  onProgress?: (progress: number) => void,
) {
  return new Promise<void>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open('PUT', url);
    request.setRequestHeader('content-type', mimeType);
    request.timeout = 30_000;
    request.upload.onprogress = (event) => {
      if (event.lengthComputable)
        onProgress?.(Math.round((event.loaded / event.total) * 95));
    };
    request.onload = () =>
      request.status >= 200 && request.status < 300
        ? resolve()
        : reject(new Error('resume.uploadFailed'));
    request.onerror = request.ontimeout = () =>
      reject(new Error('resume.uploadFailed'));
    request.send(body);
  });
}

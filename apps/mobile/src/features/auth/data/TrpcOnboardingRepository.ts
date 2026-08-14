import type { PaleaApiClient } from '@palea/api-client';
import type {
  CompleteRegistrationInput,
  Locale,
  ReserveResumeUploadInput,
  SaveProfileInput,
  SaveSkillsInput,
  SaveWorkExperienceInput,
} from '@palea/contracts';
import type { OnboardingRepository } from '../domain/OnboardingRepository';

export class TrpcOnboardingRepository implements OnboardingRepository {
  constructor(private readonly client: PaleaApiClient) {}
  me() {
    return this.client.account.me.query();
  }
  async completeRegistration(input: CompleteRegistrationInput) {
    await this.client.account.completeRegistration.mutate(input);
  }
  catalogs(locale: Locale) {
    return this.client.catalogs.onboarding.query({ locale });
  }
  async saveProfile(input: SaveProfileInput) {
    await this.client.onboarding.saveProfile.mutate(input);
  }
  async saveWorkExperience(input: SaveWorkExperienceInput) {
    await this.client.onboarding.saveWorkExperience.mutate(input);
  }
  async saveSkills(input: SaveSkillsInput) {
    await this.client.onboarding.saveSkills.mutate(input);
  }
  async complete(skipped: boolean) {
    await this.client.onboarding.complete.mutate({ skipped });
  }
  async uploadResume(input: ReserveResumeUploadInput & { bytes: Blob }) {
    const reservation = await this.client.resume.reserveUpload.mutate(input);
    try {
      const response = await fetch(reservation.signedUrl, {
        method: 'PUT',
        headers: { 'content-type': input.mimeType },
        body: input.bytes,
      });
      if (!response.ok) throw new Error('Upload failed');
      await this.client.resume.confirmUpload.mutate({
        resumeId: reservation.resumeId,
      });
    } catch (error) {
      await this.client.resume.cancelUpload
        .mutate({ resumeId: reservation.resumeId })
        .catch(() => undefined);
      throw error;
    }
  }
}

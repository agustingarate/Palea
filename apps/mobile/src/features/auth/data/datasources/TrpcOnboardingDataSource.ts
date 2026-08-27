import type { PaleaApiClient } from '@palea/api-client';
import type { OnboardingDataSource } from './OnboardingDataSource';

export class TrpcOnboardingDataSource implements OnboardingDataSource {
  constructor(private readonly client: PaleaApiClient) {}
  async getAccount() {
    return this.client.account.me.query();
  }
  async completeRegistration(
    input: Parameters<OnboardingDataSource['completeRegistration']>[0],
  ) {
    await this.client.account.completeRegistration.mutate(input);
  }
  async getCatalog(locale: Parameters<OnboardingDataSource['getCatalog']>[0]) {
    return this.client.catalogs.onboarding.query({ locale });
  }
  async saveProfile(input: Parameters<OnboardingDataSource['saveProfile']>[0]) {
    await this.client.onboarding.saveProfile.mutate(input);
  }
  async saveWorkExperience(
    input: Parameters<OnboardingDataSource['saveWorkExperience']>[0],
  ) {
    await this.client.onboarding.saveWorkExperience.mutate(input);
  }
  async saveSkills(input: Parameters<OnboardingDataSource['saveSkills']>[0]) {
    await this.client.onboarding.saveSkills.mutate(input);
  }
  async completeOnboarding() {
    await this.client.onboarding.complete.mutate({});
  }
}

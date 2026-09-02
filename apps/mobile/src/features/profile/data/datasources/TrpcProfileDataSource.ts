import type { PaleaApiClient } from '@palea/api-client';
import {
  operationResultSchema,
  createProfileExperienceInputSchema,
  profileExperienceIdInputSchema,
  profileExperienceSchema,
  profileExperiencesInputSchema,
  profileExperiencesPageSchema,
  profileCatalogInputSchema,
  profileCatalogPageSchema,
  profileDetailSchema,
  profileLocaleInputSchema,
  updateProfileRoleInputSchema,
  updateProfileExperienceInputSchema,
  replaceProfileSkillsInputSchema,
} from '@palea/contracts';
import type {
  ProfileLocale,
  ProfileExperienceInput,
  UpdateProfileRoleInput,
  UpdateProfileExperienceInput,
  ReplaceProfileSkillsInput,
} from '../../domain/entities/Profile';
import type { ProfileDataSource } from './ProfileDataSource';

export class TrpcProfileDataSource implements ProfileDataSource {
  constructor(private readonly client: PaleaApiClient) {}

  async detail(locale: ProfileLocale, signal?: AbortSignal) {
    return profileDetailSchema.parse(
      await this.client.profile.detail.query(
        profileLocaleInputSchema.parse({ locale }),
        { signal },
      ),
    );
  }

  async listInterests(
    input: { locale: ProfileLocale; search?: string; cursor?: string },
    signal?: AbortSignal,
  ) {
    return profileCatalogPageSchema.parse(
      await this.client.profile.catalogs.interests.query(
        profileCatalogInputSchema.parse(input),
        { signal },
      ),
    );
  }

  async updateRole(input: UpdateProfileRoleInput) {
    operationResultSchema.parse(
      await this.client.profile.updateRole.mutate(
        updateProfileRoleInputSchema.parse(input),
      ),
    );
  }

  async listExperiences(input: { cursor?: string }, signal?: AbortSignal) {
    return profileExperiencesPageSchema.parse(
      await this.client.profile.experiences.list.query(
        profileExperiencesInputSchema.parse(input),
        { signal },
      ),
    );
  }

  async createExperience(input: ProfileExperienceInput) {
    return profileExperienceSchema.parse(
      await this.client.profile.experiences.create.mutate(
        createProfileExperienceInputSchema.parse(input),
      ),
    );
  }

  async getExperience(experienceId: string, signal?: AbortSignal) {
    return profileExperienceSchema.parse(
      await this.client.profile.experiences.get.query(
        profileExperienceIdInputSchema.parse({ experienceId }),
        { signal },
      ),
    );
  }

  async updateExperience(input: UpdateProfileExperienceInput) {
    return profileExperienceSchema.parse(
      await this.client.profile.experiences.update.mutate(
        updateProfileExperienceInputSchema.parse(input),
      ),
    );
  }

  async deleteExperience(experienceId: string) {
    operationResultSchema.parse(
      await this.client.profile.experiences.delete.mutate(
        profileExperienceIdInputSchema.parse({ experienceId }),
      ),
    );
  }

  async listSkills(
    input: { locale: ProfileLocale; search?: string; cursor?: string },
    signal?: AbortSignal,
  ) {
    return profileCatalogPageSchema.parse(
      await this.client.profile.catalogs.skills.query(
        profileCatalogInputSchema.parse(input),
        { signal },
      ),
    );
  }

  async replaceSkills(input: ReplaceProfileSkillsInput) {
    operationResultSchema.parse(
      await this.client.profile.replaceSkills.mutate(
        replaceProfileSkillsInputSchema.parse(input),
      ),
    );
  }
}

import type {
  ProfileCatalogPage,
  ProfileExperienceInput,
  ProfileExperienceSummary,
  ProfileExperiencesPage,
  ProfileLocale,
  UpdateProfileRoleInput,
  UpdateProfileExperienceInput,
  UserProfile,
  ReplaceProfileSkillsInput,
} from '../../domain/entities/Profile';
import type { ProfileRepository } from '../../domain/repositories/ProfileRepository';
import type { ProfileDataSource } from '../datasources/ProfileDataSource';

export class ProfileRepositoryImpl implements ProfileRepository {
  constructor(private readonly dataSource: ProfileDataSource) {}

  async getDetail(
    locale: ProfileLocale,
    signal?: AbortSignal,
  ): Promise<UserProfile> {
    return this.dataSource.detail(locale, signal);
  }

  async listInterests(
    input: { locale: ProfileLocale; search?: string; cursor?: string },
    signal?: AbortSignal,
  ): Promise<ProfileCatalogPage> {
    return this.dataSource.listInterests(input, signal);
  }

  async updateRole(input: UpdateProfileRoleInput): Promise<void> {
    await this.dataSource.updateRole(input);
  }

  listExperiences(
    input: { cursor?: string },
    signal?: AbortSignal,
  ): Promise<ProfileExperiencesPage> {
    return this.dataSource.listExperiences(input, signal);
  }

  getExperience(experienceId: string, signal?: AbortSignal) {
    return this.dataSource.getExperience(experienceId, signal);
  }

  createExperience(
    input: ProfileExperienceInput,
  ): Promise<ProfileExperienceSummary> {
    return this.dataSource.createExperience(input);
  }

  updateExperience(
    input: UpdateProfileExperienceInput,
  ): Promise<ProfileExperienceSummary> {
    return this.dataSource.updateExperience(input);
  }

  async deleteExperience(experienceId: string): Promise<void> {
    await this.dataSource.deleteExperience(experienceId);
  }

  listSkills(
    input: { locale: ProfileLocale; search?: string; cursor?: string },
    signal?: AbortSignal,
  ): Promise<ProfileCatalogPage> {
    return this.dataSource.listSkills(input, signal);
  }

  async replaceSkills(input: ReplaceProfileSkillsInput): Promise<void> {
    await this.dataSource.replaceSkills(input);
  }
}

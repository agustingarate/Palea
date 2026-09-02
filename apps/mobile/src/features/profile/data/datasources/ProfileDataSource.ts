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

/** The sole profile boundary allowed to talk to the tRPC client. */
export interface ProfileDataSource {
  detail(locale: ProfileLocale, signal?: AbortSignal): Promise<UserProfile>;
  listInterests(
    input: { locale: ProfileLocale; search?: string; cursor?: string },
    signal?: AbortSignal,
  ): Promise<ProfileCatalogPage>;
  updateRole(input: UpdateProfileRoleInput): Promise<void>;
  listExperiences(
    input: { cursor?: string },
    signal?: AbortSignal,
  ): Promise<ProfileExperiencesPage>;
  getExperience(
    experienceId: string,
    signal?: AbortSignal,
  ): Promise<ProfileExperienceSummary>;
  createExperience(
    input: ProfileExperienceInput,
  ): Promise<ProfileExperienceSummary>;
  updateExperience(
    input: UpdateProfileExperienceInput,
  ): Promise<ProfileExperienceSummary>;
  deleteExperience(experienceId: string): Promise<void>;
  listSkills(
    input: { locale: ProfileLocale; search?: string; cursor?: string },
    signal?: AbortSignal,
  ): Promise<ProfileCatalogPage>;
  replaceSkills(input: ReplaceProfileSkillsInput): Promise<void>;
}

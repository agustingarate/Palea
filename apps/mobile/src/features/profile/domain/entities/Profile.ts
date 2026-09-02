export type ProfileLocale = 'es' | 'en';

export type ExperienceBand =
  'zero_to_one' | 'two_to_four' | 'five_to_eight' | 'over_eight';

export interface ProfileCatalogItem {
  readonly id: string;
  readonly slug: string;
  readonly label: string;
}

export interface ProfileIdentity {
  readonly id: string;
  readonly email: string | null;
  readonly fullName: string | null;
  readonly birthDate: string | null;
  readonly nationality: string | null;
}

export interface ProfileExperienceSummary {
  readonly id: string;
  readonly companyName: string;
  readonly role: string;
  readonly startedOn: string;
  readonly endedOn: string | null;
  readonly isCurrent: boolean;
}

export interface ProfileRole {
  readonly description: string | null;
  readonly experienceBand: ExperienceBand | null;
  readonly interests: readonly ProfileCatalogItem[];
}

export type ProfileCompletionSection = 'role' | 'experience' | 'skills';

export interface ProfileCompletion {
  readonly missing: readonly ProfileCompletionSection[];
  readonly nextSection: ProfileCompletionSection | null;
}

export interface UserProfile {
  readonly identity: ProfileIdentity;
  readonly role: ProfileRole;
  readonly experiences: readonly ProfileExperienceSummary[];
  readonly skills: readonly ProfileCatalogItem[];
  readonly completion: ProfileCompletion;
}

export interface ProfileCatalogPage {
  readonly items: readonly ProfileCatalogItem[];
  readonly nextCursor: string | null;
}

export interface ProfileExperiencesPage {
  readonly items: readonly ProfileExperienceSummary[];
  readonly nextCursor: string | null;
}

export interface UpdateProfileRoleInput {
  readonly roleDescription: string;
  readonly experienceBand: ExperienceBand;
  readonly interestIds: readonly string[];
}

export interface ProfileExperienceInput {
  readonly companyName: string;
  readonly role: string;
  readonly startedOn: string;
  readonly endedOn: string | null;
  readonly isCurrent: boolean;
}

export interface UpdateProfileExperienceInput extends ProfileExperienceInput {
  readonly experienceId: string;
}

export interface ReplaceProfileSkillsInput {
  readonly skillIds: readonly string[];
}

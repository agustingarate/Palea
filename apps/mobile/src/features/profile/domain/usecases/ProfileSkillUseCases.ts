import type {
  ProfileCatalogPage,
  ProfileLocale,
  ReplaceProfileSkillsInput,
} from '../entities/Profile';
import type { ProfileRepository } from '../repositories/ProfileRepository';

export class ListProfileSkills {
  constructor(private readonly repository: ProfileRepository) {}
  execute(
    input: { locale: ProfileLocale; search?: string; cursor?: string },
    signal?: AbortSignal,
  ): Promise<ProfileCatalogPage> {
    return this.repository.listSkills(input, signal);
  }
}

export class ReplaceProfileSkills {
  constructor(private readonly repository: ProfileRepository) {}
  execute(input: ReplaceProfileSkillsInput): Promise<void> {
    return this.repository.replaceSkills(input);
  }
}

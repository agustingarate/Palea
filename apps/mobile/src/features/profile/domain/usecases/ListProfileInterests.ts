import type { ProfileCatalogPage, ProfileLocale } from '../entities/Profile';
import type { ProfileRepository } from '../repositories/ProfileRepository';

export class ListProfileInterests {
  constructor(private readonly repository: ProfileRepository) {}

  execute(
    input: { locale: ProfileLocale; search?: string; cursor?: string },
    signal?: AbortSignal,
  ): Promise<ProfileCatalogPage> {
    return this.repository.listInterests(input, signal);
  }
}

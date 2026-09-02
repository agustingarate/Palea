import type { ProfileLocale, UserProfile } from '../entities/Profile';
import type { ProfileRepository } from '../repositories/ProfileRepository';

export class GetProfileDetail {
  constructor(private readonly repository: ProfileRepository) {}

  execute(locale: ProfileLocale, signal?: AbortSignal): Promise<UserProfile> {
    return this.repository.getDetail(locale, signal);
  }
}

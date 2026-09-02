import type {
  ProfileExperienceInput,
  ProfileExperienceSummary,
  ProfileExperiencesPage,
  UpdateProfileExperienceInput,
} from '../entities/Profile';
import type { ProfileRepository } from '../repositories/ProfileRepository';

export class ListProfileExperiences {
  constructor(private readonly repository: ProfileRepository) {}
  execute(
    input: { cursor?: string },
    signal?: AbortSignal,
  ): Promise<ProfileExperiencesPage> {
    return this.repository.listExperiences(input, signal);
  }
}

export class CreateProfileExperience {
  constructor(private readonly repository: ProfileRepository) {}
  execute(input: ProfileExperienceInput): Promise<ProfileExperienceSummary> {
    return this.repository.createExperience(input);
  }
}

export class GetProfileExperience {
  constructor(private readonly repository: ProfileRepository) {}
  execute(experienceId: string, signal?: AbortSignal) {
    return this.repository.getExperience(experienceId, signal);
  }
}

export class UpdateProfileExperience {
  constructor(private readonly repository: ProfileRepository) {}
  execute(
    input: UpdateProfileExperienceInput,
  ): Promise<ProfileExperienceSummary> {
    return this.repository.updateExperience(input);
  }
}

export class DeleteProfileExperience {
  constructor(private readonly repository: ProfileRepository) {}
  execute(experienceId: string): Promise<void> {
    return this.repository.deleteExperience(experienceId);
  }
}

import type { UpdateProfileRoleInput } from '../entities/Profile';
import type { ProfileRepository } from '../repositories/ProfileRepository';

export class UpdateProfileRole {
  constructor(private readonly repository: ProfileRepository) {}

  execute(input: UpdateProfileRoleInput): Promise<void> {
    return this.repository.updateRole(input);
  }
}

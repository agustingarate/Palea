import { GetProfileDetail } from './GetProfileDetail';
import { ListProfileInterests } from './ListProfileInterests';
import { UpdateProfileRole } from './UpdateProfileRole';
import type { ProfileRepository } from '../repositories/ProfileRepository';

describe('profile use cases', () => {
  const repository: jest.Mocked<ProfileRepository> = {
    getDetail: jest.fn(),
    listInterests: jest.fn(),
    updateRole: jest.fn(),
    listExperiences: jest.fn(),
    getExperience: jest.fn(),
    createExperience: jest.fn(),
    updateExperience: jest.fn(),
    deleteExperience: jest.fn(),
    listSkills: jest.fn(),
    replaceSkills: jest.fn(),
  };

  beforeEach(() => jest.clearAllMocks());

  it('delegates each profile operation to its repository port', async () => {
    repository.getDetail.mockResolvedValue({} as never);
    repository.listInterests.mockResolvedValue({ items: [], nextCursor: null });
    repository.updateRole.mockResolvedValue(undefined);

    await new GetProfileDetail(repository).execute('es');
    await new ListProfileInterests(repository).execute({
      locale: 'en',
      search: 'design',
    });
    await new UpdateProfileRole(repository).execute({
      roleDescription: 'Product designer',
      experienceBand: 'two_to_four',
      interestIds: ['interest-id'],
    });

    expect(repository.getDetail).toHaveBeenCalledWith('es', undefined);
    expect(repository.listInterests).toHaveBeenCalledWith(
      { locale: 'en', search: 'design' },
      undefined,
    );
    expect(repository.updateRole).toHaveBeenCalledWith({
      roleDescription: 'Product designer',
      experienceBand: 'two_to_four',
      interestIds: ['interest-id'],
    });
  });
});

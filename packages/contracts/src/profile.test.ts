import {
  createProfileExperienceInputSchema,
  profileCatalogInputSchema,
  replaceProfileSkillsInputSchema,
  updateProfileRoleInputSchema,
} from './profile';

const id = '00000000-0000-4000-8000-000000000001';

describe('profile contracts', () => {
  it('accepts optional unique interests with a maximum of three', () => {
    expect(
      updateProfileRoleInputSchema.safeParse({
        roleDescription: 'Product designer',
        experienceBand: 'two_to_four',
        interestIds: [],
      }).success,
    ).toBe(true);
    expect(
      updateProfileRoleInputSchema.safeParse({
        roleDescription: 'Product designer',
        experienceBand: 'two_to_four',
        interestIds: [id, id],
      }).success,
    ).toBe(false);
  });

  it('validates dates, unique skills and bounded catalog searches', () => {
    expect(
      createProfileExperienceInputSchema.safeParse({
        companyName: 'Palea',
        role: 'Designer',
        startedOn: '2025-02-01',
        endedOn: '2025-01-31',
        isCurrent: false,
      }).success,
    ).toBe(false);
    expect(
      replaceProfileSkillsInputSchema.safeParse({ skillIds: [id, id] }).success,
    ).toBe(false);
    expect(
      profileCatalogInputSchema.safeParse({ search: 'a'.repeat(121) }).success,
    ).toBe(false);
  });
});

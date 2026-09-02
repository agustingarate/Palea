import type { PaleaApiClient } from '@palea/api-client';
import { TrpcProfileDataSource } from './TrpcProfileDataSource';

const validDetail = {
  identity: {
    id: '8eb889f8-3e19-4f9b-9bd9-98e506e96eb6',
    email: 'ana@example.com',
    fullName: 'Ana Pérez',
    birthDate: null,
    nationality: 'AR',
  },
  role: { description: null, experienceBand: null, interests: [] },
  experiences: [],
  skills: [],
  completion: { missing: ['role'], nextSection: 'role' },
};

describe('TrpcProfileDataSource', () => {
  it('validates and sends profile calls through the tRPC boundary', async () => {
    const query = jest.fn().mockResolvedValue(validDetail);
    const interestQuery = jest
      .fn()
      .mockResolvedValue({ items: [], nextCursor: null });
    const mutate = jest.fn().mockResolvedValue({ success: true });
    const source = new TrpcProfileDataSource({
      profile: {
        detail: { query },
        catalogs: { interests: { query: interestQuery } },
        updateRole: { mutate },
      },
    } as unknown as PaleaApiClient);

    await expect(source.detail('es')).resolves.toEqual(validDetail);
    await source.listInterests({ locale: 'en', search: 'design' });
    await source.updateRole({
      roleDescription: 'Product designer',
      experienceBand: 'two_to_four',
      interestIds: ['8eb889f8-3e19-4f9b-9bd9-98e506e96eb6'],
    });

    expect(query).toHaveBeenCalledWith({ locale: 'es' }, { signal: undefined });
    expect(interestQuery).toHaveBeenCalledWith(
      { locale: 'en', search: 'design' },
      { signal: undefined },
    );
    expect(mutate).toHaveBeenCalledTimes(1);
  });

  it('rejects malformed profile data at the datasource boundary', async () => {
    const source = new TrpcProfileDataSource({
      profile: {
        detail: { query: jest.fn().mockResolvedValue({ identity: {} }) },
      },
    } as unknown as PaleaApiClient);

    await expect(source.detail('es')).rejects.toBeDefined();
  });

  it('validates an owner-scoped experience detail response at the boundary', async () => {
    const experience = {
      id: '8eb889f8-3e19-4f9b-9bd9-98e506e96eb6',
      companyName: 'Palea',
      role: 'Product designer',
      startedOn: '2024-01-01',
      endedOn: null,
      isCurrent: true,
    };
    const query = jest.fn().mockResolvedValue(experience);
    const source = new TrpcProfileDataSource({
      profile: { experiences: { get: { query } } },
    } as unknown as PaleaApiClient);

    await expect(source.getExperience(experience.id)).resolves.toEqual(
      experience,
    );
    expect(query).toHaveBeenCalledWith(
      { experienceId: experience.id },
      { signal: undefined },
    );
  });
});

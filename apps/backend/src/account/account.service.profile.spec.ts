import { AccountService } from './account.service';

const subject = '00000000-0000-4000-8000-000000000001';
const otherSubject = '00000000-0000-4000-8000-000000000002';
const interestId = '00000000-0000-4000-8000-000000000011';
const skillId = '00000000-0000-4000-8000-000000000012';
const experienceId = '00000000-0000-4000-8000-000000000013';

const experience = (id: string, day: number) => ({
  id,
  profileId: subject,
  companyName: `Company ${day}`,
  role: 'Designer',
  startedOn: new Date(`202${day}-01-01T00:00:00.000Z`),
  endedOn: null,
  isCurrent: true,
  createdAt: new Date(`202${day}-02-01T00:00:00.000Z`),
});

describe('AccountService profile operations', () => {
  it('returns a localized owner profile with the three latest experiences', async () => {
    const findUnique = jest.fn().mockResolvedValue({
      id: subject,
      fullName: 'Ada Lovelace',
      birthDate: new Date('1990-01-01T00:00:00.000Z'),
      nationality: 'AR',
      roleDescription: 'Product designer',
      experienceBand: 'two_to_four',
      interests: [
        {
          interest: {
            id: interestId,
            slug: 'diseno',
            labelEs: 'Diseño',
            labelEn: 'Design',
          },
        },
      ],
      skills: [
        {
          skill: {
            id: skillId,
            slug: 'figma',
            labelEs: 'Figma',
            labelEn: 'Figma',
          },
        },
      ],
      workExperiences: [experience(experienceId, 5)],
    });
    const service = new AccountService({
      profile: { findUnique },
    } as never);

    const result = await service.getProfile(subject, 'ada@example.com', 'en');

    expect(result).toMatchObject({
      identity: { id: subject, email: 'ada@example.com' },
      role: { interests: [{ label: 'Design' }] },
      skills: [{ label: 'Figma' }],
      completion: { missing: [] },
    });
    expect(findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: subject },
        include: expect.objectContaining({
          workExperiences: expect.objectContaining({
            take: 3,
            orderBy: [
              { startedOn: 'desc' },
              { createdAt: 'desc' },
              { id: 'desc' },
            ],
          }),
        }),
      }),
    );
  });

  it('uses an opaque, stable ten-item experience cursor scoped to the owner', async () => {
    const rows = Array.from({ length: 11 }, (_, index) =>
      experience(
        `00000000-0000-4000-8000-${String(index + 20).padStart(12, '0')}`,
        index % 9,
      ),
    );
    const findMany = jest.fn().mockResolvedValue(rows);
    const service = new AccountService({
      workExperience: { findMany },
    } as never);

    const page = await service.listProfileExperiences(subject, {});

    expect(page.items).toHaveLength(10);
    expect(page.nextCursor).not.toBe(rows[9]?.id);
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { profileId: subject },
        take: 11,
        orderBy: [{ startedOn: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }],
      }),
    );
  });

  it('does not update or delete an experience outside the authenticated owner', async () => {
    const updateService = new AccountService({
      $transaction: (run: (transaction: unknown) => Promise<unknown>) =>
        run({
          workExperience: { findFirst: jest.fn().mockResolvedValue(null) },
        }),
    } as never);
    await expect(
      updateService.updateProfileExperience(subject, {
        experienceId,
        companyName: 'Palea',
        role: 'Engineer',
        startedOn: '2024-01-01',
        endedOn: null,
        isCurrent: true,
      }),
    ).rejects.toMatchObject({ appCode: 'profile.experience_not_found' });

    const deleteMany = jest.fn().mockResolvedValue({ count: 0 });
    const deleteService = new AccountService({
      workExperience: { deleteMany },
    } as never);
    await expect(
      deleteService.deleteProfileExperience(subject, experienceId),
    ).rejects.toMatchObject({ appCode: 'profile.experience_not_found' });
    expect(deleteMany).toHaveBeenCalledWith({
      where: { id: experienceId, profileId: subject },
    });
  });

  it('returns an experience only when it belongs to the authenticated owner', async () => {
    const findFirst = jest.fn().mockResolvedValue(experience(experienceId, 5));
    const service = new AccountService({
      workExperience: { findFirst },
    } as never);

    await expect(
      service.getProfileExperience(subject, experienceId),
    ).resolves.toMatchObject({ id: experienceId, companyName: 'Company 5' });
    expect(findFirst).toHaveBeenCalledWith({
      where: { id: experienceId, profileId: subject },
    });
  });

  it('replaces skills atomically after validating only active catalog entries', async () => {
    const transaction = {
      profile: { findUnique: jest.fn().mockResolvedValue({ id: subject }) },
      skillCatalog: { count: jest.fn().mockResolvedValue(1) },
      userSkill: { deleteMany: jest.fn(), createMany: jest.fn() },
    };
    const service = new AccountService({
      $transaction: (run: (client: typeof transaction) => Promise<unknown>) =>
        run(transaction),
    } as never);

    await expect(
      service.replaceProfileSkills(subject, { skillIds: [skillId] }),
    ).resolves.toEqual({ success: true });
    expect(transaction.userSkill.deleteMany).toHaveBeenCalledWith({
      where: { profileId: subject },
    });
    expect(transaction.userSkill.createMany).toHaveBeenCalledWith({
      data: [{ profileId: subject, skillId }],
    });
  });

  it('replaces role interests atomically after validating active ownership-free catalog ids', async () => {
    const transaction = {
      profile: {
        findUnique: jest.fn().mockResolvedValue({ id: subject }),
        update: jest.fn(),
      },
      interestCatalog: { count: jest.fn().mockResolvedValue(1) },
      userInterest: { deleteMany: jest.fn(), createMany: jest.fn() },
    };
    const service = new AccountService({
      $transaction: (run: (client: typeof transaction) => Promise<unknown>) =>
        run(transaction),
    } as never);

    await service.updateProfileRole(subject, {
      roleDescription: 'Product designer',
      experienceBand: 'two_to_four',
      interestIds: [interestId],
    });

    expect(transaction.profile.update).toHaveBeenCalledWith({
      where: { id: subject },
      data: {
        roleDescription: 'Product designer',
        experienceBand: 'two_to_four',
      },
    });
    expect(transaction.userInterest.createMany).toHaveBeenCalledWith({
      data: [{ profileId: subject, interestId }],
    });
  });

  it('does not make catalog access depend on another profile', async () => {
    const findMany = jest.fn().mockResolvedValue(
      Array.from({ length: 21 }, (_, index) => ({
        id: `00000000-0000-4000-8000-${String(index + 100).padStart(12, '0')}`,
        slug: `salud-${index}`,
        labelEs: `Salud ${index}`,
        labelEn: `Health ${index}`,
      })),
    );
    const service = new AccountService({
      skillCatalog: { findMany },
    } as never);

    const page = await service.listProfileSkills({
      locale: 'es',
      search: 'salud',
    });

    expect(page.items).toHaveLength(20);
    expect(page.items[0]).toMatchObject({ label: 'Salud 0' });
    expect(page.nextCursor).toBeTruthy();
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ isActive: true }),
        take: 21,
      }),
    );
    expect(otherSubject).not.toBe(subject);
  });
});

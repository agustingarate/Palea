import { Inject, Injectable } from '@nestjs/common';
import { AppError } from '@palea/trpc';
import type {
  AccountProfile,
  CompleteRegistrationInput,
  Locale,
  OnboardingCatalog,
  ProfileCatalogInput,
  ProfileCatalogPage,
  ProfileDetail,
  ProfileExperiencesInput,
  ProfileExperiencesPage,
  CreateProfileExperienceInput,
  ReplaceProfileSkillsInput,
  SaveProfileInput,
  SaveSkillsInput,
  SaveWorkExperienceInput,
  UpdateProfileExperienceInput,
  UpdateProfileRoleInput,
} from '@palea/contracts';
import { z } from 'zod';
import { PrismaService } from '../database/prisma.service';

const catalogItemSelect = {
  id: true,
  slug: true,
  labelEs: true,
  labelEn: true,
} as const;

const experienceCursorSchema = z.object({
  startedOn: z.iso.date(),
  createdAt: z.iso.datetime(),
  id: z.uuid(),
});
const catalogCursorSchema = z.object({ slug: z.string().min(1), id: z.uuid() });

type CatalogItem = {
  id: string;
  slug: string;
  labelEs: string;
  labelEn: string;
};
type ProfileExperienceRow = {
  id: string;
  companyName: string;
  role: string;
  startedOn: Date;
  endedOn: Date | null;
  isCurrent: boolean;
  createdAt: Date;
};

@Injectable()
export class AccountService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async getMe(subject: string, email: string | null): Promise<AccountProfile> {
    const profile = await this.prisma.profile.findUnique({
      where: { id: subject },
      include: {
        interests: true,
        skills: true,
        workExperiences: { take: 1 },
        resumes: { where: { isPrimary: true, uploadStatus: 'ready' }, take: 1 },
      },
    });
    if (!profile) throw new AppError('account.profile_not_found', 'NOT_FOUND');
    const missing: AccountProfile['missing'] = [];
    if (!profile.fullName || !profile.birthDate || !profile.nationality)
      missing.push('personal');
    if (!profile.roleDescription || !profile.experienceBand)
      missing.push('profile');
    if (profile.workExperiences.length === 0) missing.push('work_experience');
    if (profile.skills.length === 0) missing.push('skills');
    const primaryResume = profile.resumes[0];
    return {
      id: profile.id,
      email,
      fullName: profile.fullName,
      birthDate: profile.birthDate ? toDate(profile.birthDate) : null,
      nationality: profile.nationality as AccountProfile['nationality'],
      roleDescription: profile.roleDescription,
      experienceBand: profile.experienceBand,
      interestIds: profile.interests.map((item) => item.interestId),
      skillIds: profile.skills.map((item) => item.skillId),
      hasWorkExperience: profile.workExperiences.length > 0,
      primaryResume: primaryResume
        ? {
            id: primaryResume.id,
            displayName: primaryResume.displayName,
            sizeBytes: Number(primaryResume.sizeBytes),
          }
        : null,
      onboardingCompletedAt:
        profile.onboardingCompletedAt?.toISOString() ?? null,
      missing,
    };
  }

  async getProfile(
    subject: string,
    email: string | null,
    locale: Locale,
  ): Promise<ProfileDetail> {
    const profile = await this.prisma.profile.findUnique({
      where: { id: subject },
      include: {
        interests: {
          include: { interest: { select: catalogItemSelect } },
        },
        skills: { include: { skill: { select: catalogItemSelect } } },
        workExperiences: {
          orderBy: [
            { startedOn: 'desc' },
            { createdAt: 'desc' },
            { id: 'desc' },
          ],
          take: 3,
        },
      },
    });
    if (!profile) throw new AppError('account.profile_not_found', 'NOT_FOUND');

    const missing: ProfileDetail['completion']['missing'] = [];
    if (!profile.roleDescription || !profile.experienceBand)
      missing.push('role');
    if (profile.workExperiences.length === 0) missing.push('experience');
    if (profile.skills.length === 0) missing.push('skills');

    return {
      identity: {
        id: profile.id,
        email,
        fullName: profile.fullName,
        birthDate: profile.birthDate ? toDate(profile.birthDate) : null,
        nationality: profile.nationality,
      },
      role: {
        description: profile.roleDescription,
        experienceBand: profile.experienceBand,
        interests: profile.interests.map(({ interest }) =>
          toLocalizedCatalogItem(interest, locale),
        ),
      },
      experiences: profile.workExperiences.map(toProfileExperience),
      skills: profile.skills.map(({ skill }) =>
        toLocalizedCatalogItem(skill, locale),
      ),
      completion: { missing, nextSection: missing[0] ?? null },
    };
  }

  async updateProfileRole(subject: string, input: UpdateProfileRoleInput) {
    return this.prisma.$transaction(async (tx) => {
      const [profile, available] = await Promise.all([
        tx.profile.findUnique({ where: { id: subject }, select: { id: true } }),
        tx.interestCatalog.count({
          where: { id: { in: input.interestIds }, isActive: true },
        }),
      ]);
      if (!profile)
        throw new AppError('account.profile_not_found', 'NOT_FOUND');
      if (available !== input.interestIds.length)
        throw new AppError('profile.invalid_interests', 'BAD_REQUEST');

      await tx.profile.update({
        where: { id: subject },
        data: {
          roleDescription: input.roleDescription,
          experienceBand: input.experienceBand,
        },
      });
      await tx.userInterest.deleteMany({ where: { profileId: subject } });
      await tx.userInterest.createMany({
        data: input.interestIds.map((interestId) => ({
          profileId: subject,
          interestId,
        })),
      });
      return { success: true as const };
    });
  }

  async listProfileExperiences(
    subject: string,
    input: ProfileExperiencesInput,
  ): Promise<ProfileExperiencesPage> {
    const cursor = input.cursor
      ? parseExperienceCursor(input.cursor)
      : undefined;
    const rows = await this.prisma.workExperience.findMany({
      where: {
        profileId: subject,
        ...(cursor
          ? {
              OR: [
                { startedOn: { lt: cursor.startedOn } },
                {
                  startedOn: cursor.startedOn,
                  createdAt: { lt: cursor.createdAt },
                },
                {
                  startedOn: cursor.startedOn,
                  createdAt: cursor.createdAt,
                  id: { lt: cursor.id },
                },
              ],
            }
          : {}),
      },
      orderBy: [{ startedOn: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }],
      take: 11,
    });
    const hasNextPage = rows.length > 10;
    const items = hasNextPage ? rows.slice(0, 10) : rows;
    return {
      items: items.map(toProfileExperience),
      nextCursor: hasNextPage ? encodeExperienceCursor(items.at(-1)!) : null,
    };
  }

  async createProfileExperience(
    subject: string,
    input: CreateProfileExperienceInput,
  ) {
    const experience = await this.prisma.$transaction(async (tx) => {
      const profile = await tx.profile.findUnique({
        where: { id: subject },
        select: { id: true },
      });
      if (!profile)
        throw new AppError('account.profile_not_found', 'NOT_FOUND');
      return tx.workExperience.create({
        data: profileExperienceData(subject, input),
      });
    });
    return toProfileExperience(experience);
  }

  async getProfileExperience(subject: string, experienceId: string) {
    const experience = await this.prisma.workExperience.findFirst({
      where: { id: experienceId, profileId: subject },
    });
    if (!experience)
      throw new AppError('profile.experience_not_found', 'NOT_FOUND');
    return toProfileExperience(experience);
  }

  async updateProfileExperience(
    subject: string,
    input: UpdateProfileExperienceInput,
  ) {
    const experience = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.workExperience.findFirst({
        where: { id: input.experienceId, profileId: subject },
        select: { id: true },
      });
      if (!existing)
        throw new AppError('profile.experience_not_found', 'NOT_FOUND');
      return tx.workExperience.update({
        where: { id: existing.id },
        data: profileExperienceData(subject, input),
      });
    });
    return toProfileExperience(experience);
  }

  async deleteProfileExperience(subject: string, experienceId: string) {
    const result = await this.prisma.workExperience.deleteMany({
      where: { id: experienceId, profileId: subject },
    });
    if (result.count !== 1)
      throw new AppError('profile.experience_not_found', 'NOT_FOUND');
    return { success: true as const };
  }

  async listProfileInterests(
    input: ProfileCatalogInput,
  ): Promise<ProfileCatalogPage> {
    const cursor = input.cursor ? parseCatalogCursor(input.cursor) : undefined;
    const rows = await this.prisma.interestCatalog.findMany({
      where: catalogWhere(input, cursor),
      select: catalogItemSelect,
      orderBy: [{ slug: 'asc' }, { id: 'asc' }],
      take: 21,
    });
    return catalogPage(rows, input.locale);
  }

  async listProfileSkills(
    input: ProfileCatalogInput,
  ): Promise<ProfileCatalogPage> {
    const cursor = input.cursor ? parseCatalogCursor(input.cursor) : undefined;
    const rows = await this.prisma.skillCatalog.findMany({
      where: catalogWhere(input, cursor),
      select: catalogItemSelect,
      orderBy: [{ slug: 'asc' }, { id: 'asc' }],
      take: 21,
    });
    return catalogPage(rows, input.locale);
  }

  async replaceProfileSkills(
    subject: string,
    input: ReplaceProfileSkillsInput,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const [profile, available] = await Promise.all([
        tx.profile.findUnique({ where: { id: subject }, select: { id: true } }),
        tx.skillCatalog.count({
          where: { id: { in: input.skillIds }, isActive: true },
        }),
      ]);
      if (!profile)
        throw new AppError('account.profile_not_found', 'NOT_FOUND');
      if (available !== input.skillIds.length)
        throw new AppError('profile.invalid_skills', 'BAD_REQUEST');

      await tx.userSkill.deleteMany({ where: { profileId: subject } });
      if (input.skillIds.length) {
        await tx.userSkill.createMany({
          data: input.skillIds.map((skillId) => ({
            profileId: subject,
            skillId,
          })),
        });
      }
      return { success: true as const };
    });
  }

  async completeRegistration(
    subject: string,
    input: CompleteRegistrationInput,
  ) {
    assertAdult(input.birthDate);
    await this.prisma.$transaction(async (tx) => {
      const profile = await tx.profile.findUnique({ where: { id: subject } });
      if (!profile)
        throw new AppError('account.profile_not_found', 'NOT_FOUND');
      // Idempotent retries are safe; conflicting completed data is never silently replaced.
      if (profile.fullName && profile.birthDate && profile.nationality) return;
      await tx.profile.update({
        where: { id: subject },
        data: {
          fullName: input.fullName,
          birthDate: new Date(`${input.birthDate}T00:00:00.000Z`),
          nationality: input.nationality,
        },
      });
    });
    return { success: true as const };
  }

  async catalogs(locale: Locale): Promise<OnboardingCatalog> {
    const [interests, skills] = await Promise.all([
      this.prisma.interestCatalog.findMany({
        where: { isActive: true },
        orderBy: { slug: 'asc' },
      }),
      this.prisma.skillCatalog.findMany({
        where: { isActive: true },
        orderBy: { slug: 'asc' },
      }),
    ]);
    return {
      interests: interests.map((item) => ({
        id: item.id,
        slug: item.slug,
        label: locale === 'es' ? item.labelEs : item.labelEn,
      })),
      skills: skills.map((item) => ({
        id: item.id,
        slug: item.slug,
        label: locale === 'es' ? item.labelEs : item.labelEn,
      })),
    };
  }

  async saveProfile(subject: string, input: SaveProfileInput) {
    const available = await this.prisma.interestCatalog.count({
      where: { id: { in: input.interestIds }, isActive: true },
    });
    if (available !== new Set(input.interestIds).size)
      throw new AppError('account.invalid_interests');
    await this.prisma.$transaction(async (tx) => {
      await tx.profile.update({
        where: { id: subject },
        data: {
          roleDescription: input.roleDescription,
          experienceBand: input.experienceBand,
        },
      });
      await tx.userInterest.deleteMany({ where: { profileId: subject } });
      if (input.interestIds.length)
        await tx.userInterest.createMany({
          data: input.interestIds.map((interestId) => ({
            profileId: subject,
            interestId,
          })),
        });
    });
    return { success: true as const };
  }

  async saveWorkExperience(subject: string, input: SaveWorkExperienceInput) {
    await this.prisma.$transaction(async (tx) => {
      await tx.workExperience.deleteMany({ where: { profileId: subject } });
      await tx.workExperience.create({
        data: {
          profileId: subject,
          companyName: input.companyName,
          role: input.role,
          startedOn: new Date(`${input.startedOn}T00:00:00.000Z`),
          endedOn: input.endedOn
            ? new Date(`${input.endedOn}T00:00:00.000Z`)
            : null,
          isCurrent: input.isCurrent,
        },
      });
    });
    return { success: true as const };
  }

  async saveSkills(subject: string, input: SaveSkillsInput) {
    const available = await this.prisma.skillCatalog.count({
      where: { id: { in: input.skillIds }, isActive: true },
    });
    if (available !== new Set(input.skillIds).size)
      throw new AppError('account.invalid_skills');
    await this.prisma.$transaction(async (tx) => {
      await tx.userSkill.deleteMany({ where: { profileId: subject } });
      if (input.skillIds.length)
        await tx.userSkill.createMany({
          data: input.skillIds.map((skillId) => ({
            profileId: subject,
            skillId,
          })),
        });
    });
    return { success: true as const };
  }

  async completeOnboarding(subject: string) {
    await this.prisma.profile.update({
      where: { id: subject },
      data: { onboardingCompletedAt: new Date() },
    });
    return { success: true as const };
  }
}

function assertAdult(birthDate: string) {
  const birth = new Date(`${birthDate}T00:00:00.000Z`);
  const threshold = new Date();
  threshold.setUTCFullYear(threshold.getUTCFullYear() - 18);
  if (birth > threshold) throw new AppError('account.minimum_age');
}

function toDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

function toLocalizedCatalogItem(item: CatalogItem, locale: Locale) {
  return {
    id: item.id,
    slug: item.slug,
    label: locale === 'es' ? item.labelEs : item.labelEn,
  };
}

function toProfileExperience(experience: ProfileExperienceRow) {
  return {
    id: experience.id,
    companyName: experience.companyName,
    role: experience.role,
    startedOn: toDate(experience.startedOn),
    endedOn: experience.endedOn ? toDate(experience.endedOn) : null,
    isCurrent: experience.isCurrent,
  };
}

function profileExperienceData(
  profileId: string,
  input: CreateProfileExperienceInput | UpdateProfileExperienceInput,
) {
  return {
    profileId,
    companyName: input.companyName,
    role: input.role,
    startedOn: new Date(`${input.startedOn}T00:00:00.000Z`),
    endedOn: input.endedOn ? new Date(`${input.endedOn}T00:00:00.000Z`) : null,
    isCurrent: input.isCurrent,
  };
}

function parseExperienceCursor(value: string) {
  try {
    const cursor = experienceCursorSchema.parse(
      JSON.parse(Buffer.from(value, 'base64url').toString('utf8')),
    );
    return {
      startedOn: new Date(`${cursor.startedOn}T00:00:00.000Z`),
      createdAt: new Date(cursor.createdAt),
      id: cursor.id,
    };
  } catch {
    throw new AppError('profile.invalid_cursor', 'BAD_REQUEST');
  }
}

function encodeExperienceCursor(experience: ProfileExperienceRow) {
  return Buffer.from(
    JSON.stringify({
      startedOn: toDate(experience.startedOn),
      createdAt: experience.createdAt.toISOString(),
      id: experience.id,
    }),
  ).toString('base64url');
}

function parseCatalogCursor(value: string) {
  try {
    return catalogCursorSchema.parse(
      JSON.parse(Buffer.from(value, 'base64url').toString('utf8')),
    );
  } catch {
    throw new AppError('profile.invalid_cursor', 'BAD_REQUEST');
  }
}

function catalogWhere(
  input: ProfileCatalogInput,
  cursor: { slug: string; id: string } | undefined,
) {
  const labelField = input.locale === 'es' ? 'labelEs' : 'labelEn';
  return {
    isActive: true,
    ...(input.search
      ? {
          OR: [
            { slug: { contains: input.search, mode: 'insensitive' as const } },
            {
              [labelField]: {
                contains: input.search,
                mode: 'insensitive' as const,
              },
            },
          ],
        }
      : {}),
    ...(cursor
      ? {
          AND: [
            {
              OR: [
                { slug: { gt: cursor.slug } },
                { slug: cursor.slug, id: { gt: cursor.id } },
              ],
            },
          ],
        }
      : {}),
  };
}

function catalogPage(rows: CatalogItem[], locale: Locale): ProfileCatalogPage {
  const hasNextPage = rows.length > 20;
  const items = hasNextPage ? rows.slice(0, 20) : rows;
  const last = items.at(-1);
  return {
    items: items.map((item) => toLocalizedCatalogItem(item, locale)),
    nextCursor:
      hasNextPage && last
        ? Buffer.from(
            JSON.stringify({ slug: last.slug, id: last.id }),
          ).toString('base64url')
        : null,
  };
}

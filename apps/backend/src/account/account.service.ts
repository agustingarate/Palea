import { Inject, Injectable } from '@nestjs/common';
import { TRPCError } from '@trpc/server';
import type {
  AccountProfile,
  CompleteRegistrationInput,
  Locale,
  OnboardingCatalog,
  SaveProfileInput,
  SaveSkillsInput,
  SaveWorkExperienceInput,
} from '@palea/contracts';
import { PrismaService } from '../database/prisma.service';

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
    if (!profile)
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Profile not found' });
    const missing: AccountProfile['missing'] = [];
    if (!profile.fullName || !profile.birthDate || !profile.nationality)
      missing.push('personal');
    if (
      !profile.roleDescription ||
      !profile.experienceBand ||
      profile.interests.length === 0
    )
      missing.push('profile');
    if (profile.workExperiences.length === 0) missing.push('work_experience');
    if (profile.skills.length === 0) missing.push('skills');
    const primaryResume = profile.resumes[0];
    return {
      id: profile.id,
      email,
      fullName: profile.fullName,
      birthDate: profile.birthDate ? toDate(profile.birthDate) : null,
      nationality: profile.nationality,
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

  async completeRegistration(
    subject: string,
    input: CompleteRegistrationInput,
  ) {
    assertAdult(input.birthDate);
    await this.prisma.profile.update({
      where: { id: subject },
      data: {
        fullName: input.fullName,
        birthDate: new Date(`${input.birthDate}T00:00:00.000Z`),
        nationality: input.nationality,
      },
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
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Invalid interests',
      });
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
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid skills' });
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
  if (birth > threshold)
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'Minimum age is 18' });
}

function toDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

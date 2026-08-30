import { Inject, Injectable } from '@nestjs/common';
import { AppError } from '@palea/trpc';
import type {
  ApplicationListInput,
  ApplicationStatus,
  CompensationRange,
  CreateApplicationStageInput,
  CreateApplicationInput,
  UpdateApplicationStageInput,
} from '@palea/contracts';
import type { Prisma } from '@prisma/client';
import sanitizeHtml from 'sanitize-html';
import { convert } from 'html-to-text';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class ApplicationsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async create(subject: string, input: CreateApplicationInput) {
    assertNotFuture(input.appliedOn, input.timeZone);
    const description = normalizeDescription(input.jobDescription?.html);

    return this.prisma.$transaction(async (transaction) => {
      await lockApplicationOrder(transaction, subject);
      if (input.resumeId) {
        const resume = await transaction.resume.findFirst({
          where: {
            id: input.resumeId,
            profileId: subject,
            uploadStatus: 'ready',
          },
          select: { id: true },
        });
        if (!resume)
          throw new AppError('applications.invalid_resume', 'BAD_REQUEST');
      }
      const aggregate = await transaction.application.aggregate({
        where: { profileId: subject, status: 'draft' },
        _max: { position: true },
      });
      const application = await transaction.application.create({
        data: {
          profileId: subject,
          companyName: input.companyName,
          role: input.role,
          appliedOn: input.appliedOn ? toDatabaseDate(input.appliedOn) : null,
          status: 'draft',
          position: (aggregate._max.position ?? -1) + 1,
          workMode: input.workMode,
          commitment: input.commitment,
          contractType: input.contractType,
          durationType: input.durationType,
          resumeId: input.resumeId,
          description: description?.text,
          descriptionHtml: description?.html,
          descriptionSource: description ? 'manual' : null,
          descriptionCaptureStatus: description ? 'completed' : 'not_requested',
          skillAnalysisStatus: 'not_requested',
        },
      });
      const note = input.privateNotes.trim();
      if (note) {
        await transaction.applicationNote.create({
          data: { applicationId: application.id, body: note },
        });
      }
      const compensations = compensationRows(
        application.id,
        input.expectedCompensation,
        input.offeredCompensation,
      );
      if (compensations.length) {
        await transaction.applicationCompensation.createMany({
          data: compensations,
        });
      }
      return toApplication(application);
    });
  }

  async list(subject: string, input: ApplicationListInput) {
    const where = {
      profileId: subject,
      status: input.status,
      ...(input.search
        ? {
            OR: [
              {
                companyName: {
                  contains: input.search,
                  mode: 'insensitive' as const,
                },
              },
              {
                role: { contains: input.search, mode: 'insensitive' as const },
              },
            ],
          }
        : {}),
    };
    const [rows, total] = await Promise.all([
      this.prisma.application.findMany({
        where,
        orderBy: [{ position: 'asc' }, { id: 'asc' }],
        cursor: input.cursor ? { id: input.cursor } : undefined,
        skip: input.cursor ? 1 : 0,
        take: input.limit + 1,
      }),
      this.prisma.application.count({ where }),
    ]);
    const hasNextPage = rows.length > input.limit;
    const pageRows = hasNextPage ? rows.slice(0, input.limit) : rows;
    return {
      items: pageRows.map((row) => ({
        id: row.id,
        companyName: row.companyName,
        role: row.role,
        appliedOn: row.appliedOn
          ? row.appliedOn.toISOString().slice(0, 10)
          : null,
        status: row.status,
        workMode: row.workMode,
        position: row.position,
      })),
      nextCursor: hasNextPage ? (pageRows.at(-1)?.id ?? null) : null,
      total,
    };
  }

  async get(subject: string, applicationId: string) {
    const application = await this.prisma.application.findFirst({
      where: { id: applicationId, profileId: subject },
      include: {
        resume: { select: { id: true, displayName: true, isPrimary: true } },
        compensations: {
          select: {
            kind: true,
            minimumMinor: true,
            maximumMinor: true,
            currency: true,
            period: true,
          },
          orderBy: { kind: 'asc' },
        },
        requiredSkills: {
          select: {
            skill: { select: { id: true, labelEs: true, labelEn: true } },
          },
        },
      },
    });
    if (!application) throw new AppError('applications.not_found', 'NOT_FOUND');
    return {
      ...toApplication(application),
      commitment: application.commitment,
      contractType: application.contractType,
      durationType: application.durationType,
      url: application.url,
      location: application.location,
      schedule: application.schedule,
      descriptionHtml: application.descriptionHtml,
      description: application.description,
      skillAnalysisStatus: application.skillAnalysisStatus,
      requiredSkills: application.requiredSkills.map(({ skill }) => skill),
      resume: application.resume,
      compensations: application.compensations.map((compensation) => ({
        ...compensation,
        minimumMinor: compensation.minimumMinor?.toString() ?? null,
        maximumMinor: compensation.maximumMinor?.toString() ?? null,
      })),
    };
  }

  async listStages(subject: string, applicationId: string) {
    await this.assertOwned(subject, applicationId);
    const stages = await this.prisma.applicationStage.findMany({
      where: { applicationId },
    });
    return stages.sort(compareStagesDescending).map(toApplicationStage);
  }

  async createStage(subject: string, input: CreateApplicationStageInput) {
    return this.prisma.$transaction(async (transaction) => {
      await assertOwned(transaction, subject, input.applicationId);
      const stage = await transaction.applicationStage.create({
        data: {
          applicationId: input.applicationId,
          name: input.name,
          eventOn: input.eventOn ? toDatabaseDate(input.eventOn) : null,
          result: input.result,
          difficulty: input.difficulty,
          questions: input.questions,
          comments: input.comments,
        },
      });
      return toApplicationStage(stage);
    });
  }

  async getStage(subject: string, applicationId: string, stageId: string) {
    const stage = await this.prisma.applicationStage.findFirst({
      where: {
        id: stageId,
        applicationId,
        application: { profileId: subject },
      },
    });
    if (!stage) throw new AppError('applications.not_found', 'NOT_FOUND');
    return toApplicationStage(stage);
  }

  async updateStage(subject: string, input: UpdateApplicationStageInput) {
    return this.prisma.$transaction(async (transaction) => {
      const stage = await findOwnedStage(
        transaction,
        subject,
        input.applicationId,
        input.stageId,
      );
      const updated = await transaction.applicationStage.update({
        where: { id: stage.id },
        data: {
          name: input.name,
          eventOn: input.eventOn ? toDatabaseDate(input.eventOn) : null,
          result: input.result,
          difficulty: input.difficulty,
          questions: input.questions,
          comments: input.comments,
        },
      });
      return toApplicationStage(updated);
    });
  }

  async deleteStage(subject: string, applicationId: string, stageId: string) {
    await this.prisma.$transaction(async (transaction) => {
      const stage = await findOwnedStage(
        transaction,
        subject,
        applicationId,
        stageId,
      );
      await transaction.applicationStage.delete({ where: { id: stage.id } });
    });
    return { success: true as const };
  }

  async getNote(subject: string, applicationId: string) {
    await this.assertOwned(subject, applicationId);
    const note = await this.prisma.applicationNote.findUnique({
      where: { applicationId },
    });
    return note
      ? { body: note.body, updatedAt: note.updatedAt.toISOString() }
      : null;
  }

  async listResources(subject: string, applicationId: string) {
    await this.assertOwned(subject, applicationId);
    const resources = await this.prisma.applicationResource.findMany({
      where: { applicationId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });
    return resources.map((resource) => ({
      id: resource.id,
      name: resource.name,
      url: resource.url,
      resourceType: resource.resourceType,
    }));
  }

  async updateResume(
    subject: string,
    input: { applicationId: string; resumeId: string | null },
  ) {
    await this.prisma.$transaction(async (transaction) => {
      const application = await transaction.application.findFirst({
        where: { id: input.applicationId, profileId: subject },
        select: { id: true },
      });
      if (!application)
        throw new AppError('applications.not_found', 'NOT_FOUND');
      if (input.resumeId) {
        const resume = await transaction.resume.findFirst({
          where: {
            id: input.resumeId,
            profileId: subject,
            uploadStatus: 'ready',
          },
          select: { id: true },
        });
        if (!resume)
          throw new AppError('applications.invalid_resume', 'BAD_REQUEST');
      }
      await transaction.application.update({
        where: { id: application.id },
        data: { resumeId: input.resumeId },
      });
    });
    return { success: true as const };
  }

  async updateStatus(
    subject: string,
    applicationId: string,
    status: ApplicationStatus,
    targetIndex?: number,
    appliedOn?: string,
    timeZone?: string,
  ) {
    assertNotFuture(appliedOn ?? null, timeZone ?? 'UTC');
    await this.prisma.$transaction(async (transaction) => {
      await lockApplicationOrder(transaction, subject);
      const application = await transaction.application.findFirst({
        where: { id: applicationId, profileId: subject },
      });
      if (!application)
        throw new AppError('applications.not_found', 'NOT_FOUND');
      if (
        application.status === 'draft' &&
        status !== 'draft' &&
        !application.appliedOn &&
        !appliedOn
      ) {
        throw new AppError('applications.date_required', 'BAD_REQUEST');
      }

      const statuses =
        application.status === status ? [status] : [application.status, status];
      const rows = await transaction.application.findMany({
        where: { profileId: subject, status: { in: statuses } },
        orderBy: [{ position: 'asc' }, { id: 'asc' }],
      });
      const source = rows.filter((row) => row.status === application.status);
      const destination = rows.filter((row) => row.status === status);
      const sourceWithoutApplication = source.filter(
        (row) => row.id !== application.id,
      );
      const destinationWithoutApplication =
        application.status === status
          ? sourceWithoutApplication
          : destination.filter((row) => row.id !== application.id);
      const insertionIndex = Math.min(
        targetIndex ?? destinationWithoutApplication.length,
        destinationWithoutApplication.length,
      );
      const orderedDestination = [...destinationWithoutApplication];
      orderedDestination.splice(insertionIndex, 0, {
        ...application,
        status,
      });
      const orderedRows =
        application.status === status
          ? orderedDestination
          : [...sourceWithoutApplication, ...orderedDestination];

      await Promise.all(
        orderedRows.map((row) =>
          transaction.application.update({
            where: { id: row.id },
            data: {
              position:
                row.status === status
                  ? orderedDestination.indexOf(row)
                  : sourceWithoutApplication.indexOf(row),
              ...(row.id === application.id
                ? {
                    status,
                    ...(!application.appliedOn && appliedOn
                      ? { appliedOn: toDatabaseDate(appliedOn) }
                      : {}),
                  }
                : {}),
            },
          }),
        ),
      );
    });
    return { success: true as const };
  }

  async remove(subject: string, applicationId: string) {
    const result = await this.prisma.application.deleteMany({
      where: { id: applicationId, profileId: subject },
    });
    if (result.count !== 1)
      throw new AppError('applications.not_found', 'NOT_FOUND');
    return { success: true as const };
  }

  private async assertOwned(subject: string, applicationId: string) {
    await assertOwned(this.prisma, subject, applicationId);
  }
}

type StageRow = {
  id: string;
  applicationId: string;
  name: string;
  eventOn: Date | null;
  result: 'pending' | 'waiting' | 'successful' | 'failed';
  difficulty: 'easy' | 'medium' | 'hard' | null;
  questions: string | null;
  comments: string | null;
  createdAt: Date;
  updatedAt: Date;
};

function toApplicationStage(stage: StageRow) {
  return {
    id: stage.id,
    applicationId: stage.applicationId,
    name: stage.name,
    eventOn: stage.eventOn?.toISOString().slice(0, 10) ?? null,
    result: stage.result,
    difficulty: stage.difficulty,
    questions: stage.questions,
    comments: stage.comments,
    createdAt: stage.createdAt.toISOString(),
    updatedAt: stage.updatedAt.toISOString(),
  };
}

function compareStagesDescending(left: StageRow, right: StageRow) {
  const leftOrder = (left.eventOn ?? left.createdAt).getTime();
  const rightOrder = (right.eventOn ?? right.createdAt).getTime();
  if (leftOrder !== rightOrder) return rightOrder - leftOrder;
  const createdOrder = right.createdAt.getTime() - left.createdAt.getTime();
  return createdOrder || right.id.localeCompare(left.id);
}

async function assertOwned(
  prisma: Pick<Prisma.TransactionClient, 'application'>,
  subject: string,
  applicationId: string,
) {
  const application = await prisma.application.findFirst({
    where: { id: applicationId, profileId: subject },
    select: { id: true },
  });
  if (!application) throw new AppError('applications.not_found', 'NOT_FOUND');
}

async function findOwnedStage(
  prisma: Pick<Prisma.TransactionClient, 'applicationStage'>,
  subject: string,
  applicationId: string,
  stageId: string,
) {
  const stage = await prisma.applicationStage.findFirst({
    where: {
      id: stageId,
      applicationId,
      application: { profileId: subject },
    },
  });
  if (!stage) throw new AppError('applications.not_found', 'NOT_FOUND');
  return stage;
}

function toApplication(application: {
  id: string;
  companyName: string;
  role: string;
  appliedOn: Date | null;
  status: ApplicationStatus;
  workMode: 'remote' | 'hybrid' | 'onsite' | 'unspecified';
  position: number;
}) {
  return {
    id: application.id,
    companyName: application.companyName,
    role: application.role,
    appliedOn: application.appliedOn
      ? application.appliedOn.toISOString().slice(0, 10)
      : null,
    status: application.status,
    workMode: application.workMode,
    position: application.position,
  };
}

function normalizeDescription(html: string | undefined) {
  if (!html) return null;
  const sanitized = sanitizeHtml(html, {
    allowedTags: [
      'p',
      'br',
      'h1',
      'h2',
      'h3',
      'strong',
      'em',
      'ul',
      'ol',
      'li',
      'a',
    ],
    allowedAttributes: { a: ['href'] },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowProtocolRelative: false,
  });
  const text = convert(sanitized, {
    wordwrap: false,
    selectors: [{ selector: 'a', options: { ignoreHref: true } }],
  }).trim();
  if (!text) return null;
  if (text.length > 50_000)
    throw new AppError('applications.description_too_long', 'BAD_REQUEST');
  return { html: sanitized, text };
}

function compensationRows(
  applicationId: string,
  expected: CompensationRange | null,
  offered: CompensationRange | null,
) {
  return [
    ...(expected ? [{ ...expected, kind: 'expected' as const }] : []),
    ...(offered ? [{ ...offered, kind: 'offered' as const }] : []),
  ].map((range) => ({
    applicationId,
    kind: range.kind,
    minimumMinor: range.minimumMinor ? BigInt(range.minimumMinor) : null,
    maximumMinor: range.maximumMinor ? BigInt(range.maximumMinor) : null,
    currency: range.currency,
    period: range.period,
  }));
}

async function lockApplicationOrder(
  transaction: Prisma.TransactionClient,
  subject: string,
) {
  await transaction.$executeRaw`
    select pg_advisory_xact_lock(
      hashtextextended(${'applications:' + subject}, 0)
    )
  `;
}

function assertNotFuture(value: string | null, timeZone: string) {
  if (value && value > todayInTimeZone(timeZone))
    throw new AppError('applications.future_date', 'BAD_REQUEST');
}

function todayInTimeZone(timeZone: string, now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? '';
  return `${part('year')}-${part('month')}-${part('day')}`;
}

function toDatabaseDate(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

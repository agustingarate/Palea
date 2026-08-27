import { Inject, Injectable } from '@nestjs/common';
import { AppError } from '@palea/trpc';
import type {
  ApplicationListInput,
  ApplicationStatus,
  CompensationRange,
  CreateApplicationInput,
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

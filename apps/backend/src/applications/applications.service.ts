import { Inject, Injectable } from '@nestjs/common';
import { AppError } from '@palea/trpc';
import type { ApplicationListInput, ApplicationStatus } from '@palea/contracts';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class ApplicationsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

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
        appliedOn: row.appliedOn.toISOString().slice(0, 10),
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
  ) {
    await this.prisma.$transaction(async (transaction) => {
      const application = await transaction.application.findFirst({
        where: { id: applicationId, profileId: subject },
      });
      if (!application)
        throw new AppError('applications.not_found', 'NOT_FOUND');

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
              ...(row.id === application.id ? { status } : {}),
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

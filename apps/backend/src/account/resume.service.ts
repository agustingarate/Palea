import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { TRPCError } from '@trpc/server';
import type {
  ConfirmResumeUploadInput,
  DeleteResumeInput,
  ReserveResumeUploadInput,
} from '@palea/contracts';
import type { Prisma } from '@prisma/client';
import { environment } from '../config/environment';
import { PrismaService } from '../database/prisma.service';
import { lockResumeLibrary } from './resume-persistence';
import { ResumePdfValidator } from './resume-pdf.validator';

const BUCKET = 'resumes';

@Injectable()
export class ResumeService {
  private readonly storage = createClient(
    environment.supabaseUrl,
    environment.supabaseServiceRoleKey,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(ResumePdfValidator)
    private readonly pdfValidator: ResumePdfValidator,
  ) {}

  async reserve(subject: string, input: ReserveResumeUploadInput) {
    const resumeId = randomUUID();
    const path = `${subject}/${resumeId}.pdf`;
    const expiresAt = new Date(
      Date.now() + environment.resumeUploadTtlSeconds * 1000,
    );
    await this.prisma.$transaction(async (tx) => {
      await lockResumeLibrary(tx, subject);
      const policy = await this.libraryPolicy(tx);
      if (input.sizeBytes > Number(policy.maxSizeBytes))
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'resume.maxSize' });
      await this.assertLibraryQuota(tx, subject, policy.maxResumes);
      await this.assertReservationQuota(tx, subject);
      await tx.resume.create({
        data: {
          id: resumeId,
          profileId: subject,
          storagePath: path,
          displayName: input.displayName,
          mimeType: input.mimeType,
          sizeBytes: BigInt(input.sizeBytes),
          isPrimary: false,
          uploadStatus: 'pending',
          uploadExpiresAt: expiresAt,
          uploadedAt: null,
        },
      });
    });
    const { data, error } = await this.storage.storage
      .from(BUCKET)
      .createSignedUploadUrl(path)
      .catch(() => ({ data: null, error: true }));
    if (error || !data || new Date() >= expiresAt) {
      await this.markFailed(subject, resumeId);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'resume.cleanup_failed',
      });
    }
    return {
      resumeId,
      path,
      signedUrl: data.signedUrl,
      expiresAt: expiresAt.toISOString(),
    };
  }

  async confirm(
    subject: string,
    resumeId: string,
    primaryMode: ConfirmResumeUploadInput['primaryMode'],
  ) {
    const resume = await this.prisma.resume.findFirst({
      where: { id: resumeId, profileId: subject },
    });
    if (!resume)
      throw new TRPCError({ code: 'NOT_FOUND', message: 'resume.not_found' });
    if (resume.uploadStatus === 'ready') return { success: true as const };
    if (
      resume.uploadStatus !== 'pending' ||
      !resume.uploadExpiresAt ||
      resume.uploadExpiresAt <= new Date()
    ) {
      await this.markFailed(subject, resumeId);
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'resume.expired' });
    }
    const policy = await this.libraryPolicy(this.prisma);
    const { data, error } = await this.storage.storage
      .from(BUCKET)
      .download(resume.storagePath)
      .catch(() => ({ data: null, error: true }));
    if (error || !data)
      return this.fail(subject, resumeId, 'resume.invalid_file');
    if (
      data.size > Number(policy.maxSizeBytes) ||
      data.size !== Number(resume.sizeBytes)
    )
      return this.fail(subject, resumeId, 'resume.invalid_file');
    const bytes = new Uint8Array(await data.arrayBuffer());
    const isPdf =
      bytes.length >= 5 &&
      String.fromCharCode(...bytes.slice(0, 5)) === '%PDF-';
    if (
      !isPdf ||
      bytes.length !== Number(resume.sizeBytes) ||
      bytes.length > Number(policy.maxSizeBytes) ||
      !(await this.pdfValidator.validate(bytes))
    ) {
      return this.fail(subject, resumeId, 'resume.invalid_file');
    }
    await this.prisma.$transaction(async (tx) => {
      await lockResumeLibrary(tx, subject);
      const current = await tx.resume.findFirst({
        where: { id: resumeId, profileId: subject },
      });
      if (current?.uploadStatus === 'ready') return;
      if (
        current?.uploadStatus !== 'pending' ||
        !current.uploadExpiresAt ||
        current.uploadExpiresAt <= new Date()
      )
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'resume.expired' });
      const makePrimary =
        primaryMode === 'replace' ||
        (primaryMode === 'if_missing' &&
          !(await tx.resume.count({
            where: { profileId: subject, isPrimary: true },
          })));
      if (makePrimary)
        await tx.resume.updateMany({
          where: { profileId: subject, isPrimary: true },
          data: { isPrimary: false },
        });
      await tx.resume.update({
        where: { id: resumeId },
        data: {
          uploadStatus: 'ready',
          uploadExpiresAt: null,
          uploadedAt: new Date(),
          isPrimary: makePrimary,
        },
      });
    });
    return { success: true as const };
  }

  async list(subject: string) {
    const resumes = await this.prisma.resume.findMany({
      where: { profileId: subject, uploadStatus: 'ready' },
      orderBy: [{ isPrimary: 'desc' }, { uploadedAt: 'desc' }, { id: 'asc' }],
    });
    return resumes.map((resume) => ({
      id: resume.id,
      displayName: resume.displayName,
      sizeBytes: Number(resume.sizeBytes),
      isPrimary: resume.isPrimary,
      uploadedAt: resume.uploadedAt?.toISOString() ?? null,
    }));
  }

  async createDownload(subject: string, resumeId: string) {
    return this.createAccess(subject, resumeId, true);
  }

  async createPreview(subject: string, resumeId: string) {
    return this.createAccess(subject, resumeId, false);
  }

  private async createAccess(
    subject: string,
    resumeId: string,
    download: boolean,
  ) {
    const resume = await this.prisma.resume.findFirst({
      where: { id: resumeId, profileId: subject, uploadStatus: 'ready' },
      select: { storagePath: true, displayName: true },
    });
    if (!resume)
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Resume not found' });
    const expiresIn = 60;
    const { data, error } = await this.storage.storage
      .from(BUCKET)
      .createSignedUrl(
        resume.storagePath,
        expiresIn,
        download
          ? {
              download: resume.displayName,
            }
          : undefined,
      );
    if (error)
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'resume.download_failed',
      });
    return {
      signedUrl: data.signedUrl,
      expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
    };
  }

  async policy(subject: string) {
    const policy = await this.libraryPolicy(this.prisma);
    const usedResumes = await this.prisma.resume.count({
      where: {
        profileId: subject,
        OR: [
          { uploadStatus: 'ready' },
          { uploadStatus: 'pending', uploadExpiresAt: { gt: new Date() } },
        ],
      },
    });
    return {
      maxSizeBytes: Number(policy.maxSizeBytes),
      maxResumes: policy.maxResumes,
      usedResumes,
    };
  }

  async rename(subject: string, resumeId: string, displayName: string) {
    const updated = await this.prisma.resume.updateMany({
      where: { id: resumeId, profileId: subject, uploadStatus: 'ready' },
      data: { displayName },
    });
    if (!updated.count)
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Resume not found' });
    return { success: true as const };
  }

  async setPrimary(subject: string, resumeId: string) {
    await this.prisma.$transaction(async (tx) => {
      await lockResumeLibrary(tx, subject);
      const resume = await tx.resume.findFirst({
        where: { id: resumeId, profileId: subject, uploadStatus: 'ready' },
        select: { id: true },
      });
      if (!resume)
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Resume not found' });
      await tx.resume.updateMany({
        where: { profileId: subject, isPrimary: true },
        data: { isPrimary: false },
      });
      await tx.resume.update({
        where: { id: resume.id },
        data: { isPrimary: true },
      });
    });
    return { success: true as const };
  }

  async deleteImpact(subject: string, resumeId: string) {
    const resume = await this.prisma.resume.findFirst({
      where: { id: resumeId, profileId: subject, uploadStatus: 'ready' },
      select: { id: true, isPrimary: true },
    });
    if (!resume)
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Resume not found' });
    const applicationCount = await this.prisma.application.count({
      where: { profileId: subject, resumeId },
    });
    return {
      resumeId: resume.id,
      applicationCount,
      isPrimary: resume.isPrimary,
    };
  }

  async remove(subject: string, input: DeleteResumeInput) {
    await this.prisma.$transaction(async (tx) => {
      await lockResumeLibrary(tx, subject);
      const resume = await tx.resume.findFirst({
        where: {
          id: input.resumeId,
          profileId: subject,
          uploadStatus: 'ready',
        },
      });
      if (!resume)
        throw new TRPCError({ code: 'NOT_FOUND', message: 'resume.not_found' });
      const applicationCount = await tx.application.count({
        where: { profileId: subject, resumeId: resume.id },
      });
      if (
        applicationCount !== input.expectedImpact.applicationCount ||
        resume.isPrimary !== input.expectedImpact.isPrimary
      ) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'resume.impact_changed',
        });
      }
      // SET NULL and the cleanup outbox trigger commit together with deletion.
      await tx.resume.delete({ where: { id: resume.id } });
    });
    return { success: true as const };
  }

  async cancel(subject: string, resumeId: string) {
    await this.prisma.$transaction(async (tx) => {
      await lockResumeLibrary(tx, subject);
      const resume = await tx.resume.findFirst({
        where: { id: resumeId, profileId: subject },
        select: { uploadStatus: true },
      });
      if (!resume)
        throw new TRPCError({ code: 'NOT_FOUND', message: 'resume.not_found' });
      if (resume.uploadStatus === 'ready')
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'resume.already_confirmed',
        });
      await tx.resume.updateMany({
        where: { id: resumeId, profileId: subject, uploadStatus: 'pending' },
        data: { uploadStatus: 'failed', uploadExpiresAt: null },
      });
    });
    return { success: true as const };
  }

  private async fail(
    subject: string,
    resumeId: string,
    message: string,
  ): Promise<never> {
    await this.markFailed(subject, resumeId);
    throw new TRPCError({ code: 'BAD_REQUEST', message });
  }

  private async markFailed(subject: string, resumeId: string) {
    await this.prisma.$transaction(async (tx) => {
      await lockResumeLibrary(tx, subject);
      await tx.resume.updateMany({
        where: { id: resumeId, profileId: subject, uploadStatus: 'pending' },
        data: { uploadStatus: 'failed', uploadExpiresAt: null },
      });
    });
  }

  private libraryPolicy(tx: Prisma.TransactionClient) {
    return tx.resumeLibraryPolicy.findUniqueOrThrow({
      where: { id: 'global' },
    });
  }

  private async assertReservationQuota(
    tx: Prisma.TransactionClient,
    subject: string,
  ) {
    const now = new Date();
    const windowStart = new Date(
      now.getTime() - environment.resumeReservationWindowSeconds * 1000,
    );
    const [pending, reservations] = await Promise.all([
      tx.resume.count({
        where: {
          profileId: subject,
          uploadStatus: 'pending',
          uploadExpiresAt: { gt: now },
        },
      }),
      tx.resume.count({
        where: { profileId: subject, createdAt: { gte: windowStart } },
      }),
    ]);
    if (pending >= environment.resumeMaxPendingUploads)
      throw new TRPCError({
        code: 'TOO_MANY_REQUESTS',
        message: 'resume.too_many_pending',
      });
    if (reservations >= environment.resumeMaxReservationsPerWindow)
      throw new TRPCError({
        code: 'TOO_MANY_REQUESTS',
        message: 'resume.rate_limited',
      });
  }

  private async assertLibraryQuota(
    tx: Prisma.TransactionClient,
    subject: string,
    maximum: number,
  ) {
    const count = await tx.resume.count({
      where: {
        profileId: subject,
        OR: [
          { uploadStatus: 'ready' },
          { uploadStatus: 'pending', uploadExpiresAt: { gt: new Date() } },
        ],
      },
    });
    if (count >= maximum)
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'resume.library_full',
      });
  }
}

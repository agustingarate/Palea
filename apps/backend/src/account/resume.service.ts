import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { TRPCError } from '@trpc/server';
import type { ReserveResumeUploadInput } from '@palea/contracts';
import { environment } from '../config/environment';
import { PrismaService } from '../database/prisma.service';

const BUCKET = 'resumes';
// The API is the single source of truth for library limits. Keeping this policy
// behind the service allows a future backoffice to replace it without clients
// duplicating business constants.
const LIBRARY_POLICY = { maxSizeBytes: 10 * 1024 * 1024, maxResumes: 10 };

@Injectable()
export class ResumeService {
  private readonly storage = createClient(
    environment.supabaseUrl,
    environment.supabaseServiceRoleKey,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async reserve(subject: string, input: ReserveResumeUploadInput) {
    await this.cleanupExpired(subject);
    await this.assertLibraryQuota(subject);
    await this.assertReservationQuota(subject);
    const resumeId = randomUUID();
    const path = `${subject}/${resumeId}.pdf`;
    const expiresAt = new Date(
      Date.now() + environment.resumeUploadTtlSeconds * 1000,
    );
    await this.prisma.resume.create({
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
    const { data, error } = await this.storage.storage
      .from(BUCKET)
      .createSignedUploadUrl(path);
    if (error) {
      // Preserve the reservation for a later cleanup/retry; Storage is external.
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

  async confirm(subject: string, resumeId: string, makePrimary: boolean) {
    const resume = await this.ownedPending(subject, resumeId);
    const { data, error } = await this.storage.storage
      .from(BUCKET)
      .download(resume.storagePath);
    if (error || !data)
      return this.fail(resumeId, resume.storagePath, 'Upload not found');
    const bytes = new Uint8Array(await data.arrayBuffer());
    const isPdf =
      bytes.length >= 5 &&
      String.fromCharCode(...bytes.slice(0, 5)) === '%PDF-';
    if (
      !isPdf ||
      bytes.length !== Number(resume.sizeBytes) ||
      bytes.length > LIBRARY_POLICY.maxSizeBytes ||
      // Encrypted PDFs cannot be rendered consistently in every product surface.
      new TextDecoder('latin1').decode(bytes).includes('/Encrypt')
    ) {
      return this.fail(resumeId, resume.storagePath, 'Invalid PDF upload');
    }
    await this.prisma.$transaction(async (tx) => {
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
    const resume = await this.prisma.resume.findFirst({
      where: { id: resumeId, profileId: subject, uploadStatus: 'ready' },
      select: { storagePath: true, displayName: true },
    });
    if (!resume)
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Resume not found' });
    const expiresIn = 60;
    const { data, error } = await this.storage.storage
      .from(BUCKET)
      .createSignedUrl(resume.storagePath, expiresIn, {
        download: resume.displayName,
      });
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
    const usedResumes = await this.prisma.resume.count({
      where: {
        profileId: subject,
        uploadStatus: { in: ['pending', 'ready'] },
      },
    });
    return { ...LIBRARY_POLICY, usedResumes };
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

  async remove(subject: string, resumeId: string) {
    const resume = await this.prisma.resume.findFirst({
      where: { id: resumeId, profileId: subject, uploadStatus: 'ready' },
      select: { id: true, storagePath: true },
    });
    if (!resume)
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Resume not found' });
    const { error } = await this.storage.storage
      .from(BUCKET)
      .remove([resume.storagePath]);
    if (error)
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'resume.cleanup_failed',
      });
    // applications.resume_id is ON DELETE SET NULL by the database contract.
    await this.prisma.resume.delete({ where: { id: resume.id } });
    return { success: true as const };
  }

  async cancel(subject: string, resumeId: string) {
    const resume = await this.ownedPending(subject, resumeId);
    const { error } = await this.storage.storage
      .from(BUCKET)
      .remove([resume.storagePath]);
    if (error)
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'resume.cleanup_failed',
      });
    await this.prisma.resume.update({
      where: { id: resumeId },
      data: { uploadStatus: 'failed', uploadExpiresAt: null },
    });
    return { success: true as const };
  }

  private async ownedPending(subject: string, resumeId: string) {
    const resume = await this.prisma.resume.findFirst({
      where: { id: resumeId, profileId: subject, uploadStatus: 'pending' },
    });
    if (!resume)
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Pending upload not found',
      });
    if (resume.uploadExpiresAt && resume.uploadExpiresAt <= new Date()) {
      return this.fail(
        resume.id,
        resume.storagePath,
        'Upload reservation expired',
      );
    }
    return resume;
  }

  private async fail(
    resumeId: string,
    path: string,
    message: string,
  ): Promise<never> {
    const { error } = await this.storage.storage.from(BUCKET).remove([path]);
    if (error)
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'resume.cleanup_failed',
      });
    await this.prisma.resume.update({
      where: { id: resumeId },
      data: { uploadStatus: 'failed', uploadExpiresAt: null },
    });
    throw new TRPCError({ code: 'BAD_REQUEST', message });
  }

  private async cleanupExpired(subject?: string) {
    const expired = await this.prisma.resume.findMany({
      where: {
        ...(subject ? { profileId: subject } : {}),
        uploadStatus: 'pending',
        uploadExpiresAt: { lt: new Date() },
      },
    });
    if (!expired.length) return;
    const { error } = await this.storage.storage
      .from(BUCKET)
      .remove(expired.map((item) => item.storagePath));
    if (error)
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'resume.cleanup_failed',
      });
    await this.prisma.resume.updateMany({
      where: { id: { in: expired.map((item) => item.id) } },
      data: { uploadStatus: 'failed', uploadExpiresAt: null },
    });
  }

  private async assertReservationQuota(subject: string) {
    const now = new Date();
    const windowStart = new Date(
      now.getTime() - environment.resumeReservationWindowSeconds * 1000,
    );
    const [pending, reservations] = await this.prisma.$transaction([
      this.prisma.resume.count({
        where: {
          profileId: subject,
          uploadStatus: 'pending',
          uploadExpiresAt: { gt: now },
        },
      }),
      this.prisma.resume.count({
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

  private async assertLibraryQuota(subject: string) {
    const count = await this.prisma.resume.count({
      where: { profileId: subject, uploadStatus: { in: ['pending', 'ready'] } },
    });
    if (count >= LIBRARY_POLICY.maxResumes)
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'resume.library_full',
      });
  }
}

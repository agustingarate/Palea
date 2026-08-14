import { randomUUID } from 'node:crypto';
import { Inject, Injectable, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { TRPCError } from '@trpc/server';
import type { ReserveResumeUploadInput } from '@palea/contracts';
import { environment } from '../config/environment';
import { PrismaService } from '../database/prisma.service';

const BUCKET = 'resumes';

@Injectable()
export class ResumeService implements OnModuleInit, OnModuleDestroy {
  private readonly storage = createClient(
    environment.supabaseUrl,
    environment.supabaseServiceRoleKey,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}
  private cleanupTimer: NodeJS.Timeout | undefined;

  onModuleInit() {
    // Cleanup is deliberately independent of new uploads: abandoned signed URLs
    // cannot leave rows or Storage objects behind indefinitely.
    this.cleanupTimer = setInterval(() => void this.cleanupExpired(), 60_000);
    this.cleanupTimer.unref();
  }

  onModuleDestroy() {
    if (this.cleanupTimer) clearInterval(this.cleanupTimer);
  }

  async reserve(subject: string, input: ReserveResumeUploadInput) {
    await this.cleanupExpired(subject);
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
      await this.prisma.resume.delete({ where: { id: resumeId } });
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Could not reserve upload',
      });
    }
    return {
      resumeId,
      path,
      signedUrl: data.signedUrl,
      expiresAt: expiresAt.toISOString(),
    };
  }

  async confirm(subject: string, resumeId: string) {
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
      bytes.length > 10 * 1024 * 1024
    ) {
      return this.fail(resumeId, resume.storagePath, 'Invalid PDF upload');
    }
    await this.prisma.$transaction(async (tx) => {
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
          isPrimary: true,
        },
      });
    });
    return { success: true as const };
  }

  async cancel(subject: string, resumeId: string) {
    const resume = await this.ownedPending(subject, resumeId);
    await this.storage.storage.from(BUCKET).remove([resume.storagePath]);
    await this.prisma.resume.delete({ where: { id: resumeId } });
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
      return this.fail(resume.id, resume.storagePath, 'Upload reservation expired');
    }
    return resume;
  }

  private async fail(
    resumeId: string,
    path: string,
    message: string,
  ): Promise<never> {
    await this.storage.storage.from(BUCKET).remove([path]);
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
    await this.storage.storage
      .from(BUCKET)
      .remove(expired.map((item) => item.storagePath));
    await this.prisma.resume.deleteMany({
      where: { id: { in: expired.map((item) => item.id) } },
    });
  }
}

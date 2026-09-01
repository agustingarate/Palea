import {
  Inject,
  Injectable,
  Logger,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { PrismaService } from '../database/prisma.service';
import { environment } from '../config/environment';

@Injectable()
export class ResumeCleanupService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ResumeCleanupService.name);
  private readonly storage = createClient(
    environment.supabaseUrl,
    environment.supabaseServiceRoleKey,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  private timer?: ReturnType<typeof setInterval>;
  private running = false;

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  onModuleInit() {
    this.timer = setInterval(() => void this.drain(), 30_000);
    this.timer.unref();
    void this.drain();
  }
  onModuleDestroy() {
    clearInterval(this.timer);
  }

  async drain() {
    if (this.running) return;
    this.running = true;
    try {
      await this.prisma.resume.updateMany({
        where: {
          uploadStatus: 'pending',
          uploadExpiresAt: { lte: new Date() },
        },
        data: { uploadStatus: 'failed', uploadExpiresAt: null },
      });
      // Claim with a lease. A process exit returns this job to another worker.
      const jobs = await this.prisma.$queryRaw<
        Array<{
          id: string;
          storagePath: string;
          attempts: number;
          finalizeAfter: Date;
        }>
      >`
        update public.resume_cleanup_jobs set available_at = now() + interval '5 minutes', attempts = attempts + 1
        where id in (select id from public.resume_cleanup_jobs where available_at <= now()
          order by available_at for update skip locked limit 20)
        returning id, storage_path as "storagePath", attempts, finalize_after as "finalizeAfter"
      `;
      for (const job of jobs) {
        try {
          const { error } = await this.storage.storage
            .from('resumes')
            .remove([job.storagePath]);
          if (error) throw new Error('storage-unavailable');
          if (job.finalizeAfter > new Date()) {
            await this.prisma.resumeCleanupJob.update({
              where: { id: job.id },
              data: { availableAt: job.finalizeAfter },
            });
          } else
            await this.prisma.resumeCleanupJob.delete({
              where: { id: job.id },
            });
        } catch {
          await this.prisma.resumeCleanupJob.update({
            where: { id: job.id },
            data: {
              availableAt: new Date(
                Date.now() +
                  Math.min(3_600_000, 30_000 * 2 ** Math.min(job.attempts, 7)),
              ),
            },
          });
        }
      }
    } catch {
      // Never log signed URLs, paths, document data or provider error payloads.
      this.logger.warn(
        'Resume cleanup deferred; persisted jobs will be retried.',
      );
    } finally {
      this.running = false;
    }
  }
}

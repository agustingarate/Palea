import { ResumeCleanupService } from './resume-cleanup.service';

it('retains and reschedules failed Storage cleanup, then removes the job only after success', async () => {
  const job = {
    id: 'job-id',
    storagePath: 'synthetic/cv.pdf',
    attempts: 1,
    finalizeAfter: new Date(0),
  };
  const prisma = {
    resume: { updateMany: jest.fn() },
    $queryRaw: jest.fn().mockResolvedValue([job]),
    resumeCleanupJob: { update: jest.fn(), delete: jest.fn() },
  };
  const remove = jest
    .fn()
    .mockResolvedValueOnce({ error: new Error('unavailable') })
    .mockResolvedValue({ error: null });
  const service = new ResumeCleanupService(prisma as never);
  Object.assign(service, {
    storage: { storage: { from: () => ({ remove }) } },
  });
  await service.drain();
  expect(prisma.resumeCleanupJob.delete).not.toHaveBeenCalled();
  expect(prisma.resumeCleanupJob.update).toHaveBeenCalledWith({
    where: { id: job.id },
    data: { availableAt: expect.any(Date) },
  });
  await service.drain();
  expect(prisma.resumeCleanupJob.delete).toHaveBeenCalledWith({
    where: { id: job.id },
  });
});

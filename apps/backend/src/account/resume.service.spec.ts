import { ResumeService } from './resume.service';

const subject = '00000000-0000-4000-8000-000000000001';
const resumeId = '00000000-0000-4000-8000-000000000002';
const pdf = new TextEncoder().encode('%PDF-valid');

function serviceForConfirmation(makePrimary: boolean) {
  const updateMany = jest.fn();
  const update = jest.fn();
  const prisma = {
    resume: {
      findFirst: jest.fn().mockResolvedValue({
        id: resumeId,
        profileId: subject,
        storagePath: `${subject}/${resumeId}.pdf`,
        sizeBytes: BigInt(pdf.byteLength),
        uploadExpiresAt: new Date(Date.now() + 60_000),
      }),
    },
    $transaction: (run: (tx: unknown) => Promise<unknown>) =>
      run({ resume: { updateMany, update } }),
  };
  const service = new ResumeService(prisma as never);
  Object.assign(service, {
    storage: {
      storage: {
        from: () => ({
          download: jest.fn().mockResolvedValue({
            data: new Blob([pdf]),
            error: null,
          }),
        }),
      },
    },
  });
  return { service, update, updateMany, makePrimary };
}

describe('ResumeService', () => {
  it('lists only ready owner resumes with the primary first', async () => {
    const findMany = jest.fn().mockResolvedValue([
      {
        id: resumeId,
        displayName: 'Primary.pdf',
        sizeBytes: 100n,
        isPrimary: true,
        uploadedAt: new Date('2026-08-20T12:00:00.000Z'),
      },
    ]);
    const service = new ResumeService({ resume: { findMany } } as never);

    await expect(service.list(subject)).resolves.toEqual([
      {
        id: resumeId,
        displayName: 'Primary.pdf',
        sizeBytes: 100,
        isPrimary: true,
        uploadedAt: '2026-08-20T12:00:00.000Z',
      },
    ]);
    expect(findMany).toHaveBeenCalledWith({
      where: { profileId: subject, uploadStatus: 'ready' },
      orderBy: [{ isPrimary: 'desc' }, { uploadedAt: 'desc' }, { id: 'asc' }],
    });
  });

  it('keeps the current primary when an application uploads a resume', async () => {
    const { service, update, updateMany } = serviceForConfirmation(false);

    await service.confirm(subject, resumeId, false);

    expect(updateMany).not.toHaveBeenCalled();
    expect(update).toHaveBeenCalledWith({
      where: { id: resumeId },
      data: expect.objectContaining({
        uploadStatus: 'ready',
        isPrimary: false,
      }),
    });
  });

  it('still replaces the primary for onboarding uploads', async () => {
    const { service, update, updateMany } = serviceForConfirmation(true);

    await service.confirm(subject, resumeId, true);

    expect(updateMany).toHaveBeenCalledWith({
      where: { profileId: subject, isPrimary: true },
      data: { isPrimary: false },
    });
    expect(update).toHaveBeenCalledWith({
      where: { id: resumeId },
      data: expect.objectContaining({ isPrimary: true }),
    });
  });
});

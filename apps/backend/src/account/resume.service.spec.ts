import { ResumeService } from './resume.service';

const subject = '00000000-0000-4000-8000-000000000001';
const resumeId = '00000000-0000-4000-8000-000000000002';
const pdf = new TextEncoder().encode('%PDF-valid');

function serviceForConfirmation(makePrimary: boolean) {
  const updateMany = jest.fn();
  const update = jest.fn();
  const prisma = {
    $queryRaw: jest.fn().mockResolvedValue([]),
    resumeLibraryPolicy: {
      findUniqueOrThrow: jest
        .fn()
        .mockResolvedValue({ maxSizeBytes: 10485760n, maxResumes: 10 }),
    },
    resume: {
      updateMany,
      update,
      count: jest.fn().mockResolvedValue(makePrimary ? 0 : 1),
      findFirst: jest.fn().mockResolvedValue({
        id: resumeId,
        profileId: subject,
        storagePath: `${subject}/${resumeId}.pdf`,
        sizeBytes: BigInt(pdf.byteLength),
        uploadStatus: 'pending',
        uploadExpiresAt: new Date(Date.now() + 60_000),
      }),
    },
    $transaction: (run: (tx: unknown) => Promise<unknown>) => run(prisma),
  };
  const validator = { validate: jest.fn().mockResolvedValue(true) };
  const service = new ResumeService(prisma as never, validator as never);
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
  return { service, update, updateMany, makePrimary, prisma, validator };
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
    const service = new ResumeService(
      { resume: { findMany } } as never,
      {} as never,
    );

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

    await service.confirm(subject, resumeId, 'preserve');

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

    await service.confirm(subject, resumeId, 'replace');

    expect(updateMany).toHaveBeenCalledWith({
      where: { profileId: subject, isPrimary: true },
      data: { isPrimary: false },
    });
    expect(update).toHaveBeenCalledWith({
      where: { id: resumeId },
      data: expect.objectContaining({ isPrimary: true }),
    });
  });

  it('creates a short-lived forced-download URL only for an owned ready CV', async () => {
    const createSignedUrl = jest.fn().mockResolvedValue({
      data: { signedUrl: 'https://storage.example.com/signed' },
      error: null,
    });
    const service = new ResumeService(
      {
        resume: {
          findFirst: jest.fn().mockResolvedValue({
            storagePath: `${subject}/${resumeId}.pdf`,
            displayName: 'My CV.pdf',
          }),
        },
      } as never,
      {} as never,
    );
    Object.assign(service, {
      storage: { storage: { from: () => ({ createSignedUrl }) } },
    });

    await expect(
      service.createDownload(subject, resumeId),
    ).resolves.toMatchObject({
      signedUrl: 'https://storage.example.com/signed',
    });
    expect(createSignedUrl).toHaveBeenCalledWith(
      `${subject}/${resumeId}.pdf`,
      60,
      {
        download: 'My CV.pdf',
      },
    );
    await service.createPreview(subject, resumeId);
    expect(createSignedUrl).toHaveBeenLastCalledWith(
      `${subject}/${resumeId}.pdf`,
      60,
      undefined,
    );
  });

  it.each([true, false])(
    'assigns a library upload only when no primary exists: %s',
    async (missing) => {
      const { service, update } = serviceForConfirmation(missing);
      await service.confirm(subject, resumeId, 'if_missing');
      expect(update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ isPrimary: missing }),
        }),
      );
    },
  );

  it('releases an invalid upload reservation without waiting for Storage cleanup', async () => {
    const { service, validator, updateMany, update } =
      serviceForConfirmation(false);
    validator.validate.mockResolvedValue(false);
    await expect(
      service.confirm(subject, resumeId, 'preserve'),
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    expect(update).not.toHaveBeenCalled();
    expect(updateMany).toHaveBeenCalledWith({
      where: { id: resumeId, profileId: subject, uploadStatus: 'pending' },
      data: { uploadStatus: 'failed', uploadExpiresAt: null },
    });
  });

  it('does not repeat primary changes when confirmation is retried', async () => {
    const { service, prisma, validator, update } =
      serviceForConfirmation(false);
    prisma.resume.findFirst.mockResolvedValue({
      uploadStatus: 'ready',
    } as never);
    await expect(
      service.confirm(subject, resumeId, 'replace'),
    ).resolves.toEqual({ success: true });
    expect(validator.validate).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });

  it.each([
    'createPreview',
    'createDownload',
    'confirm',
    'deleteImpact',
  ] as const)('rejects foreign or missing CVs in %s', async (operation) => {
    const { service, prisma } = serviceForConfirmation(false);
    prisma.resume.findFirst.mockResolvedValue(null as never);
    await expect(
      service[operation](subject, resumeId, 'preserve'),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    expect(prisma.resume.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: resumeId, profileId: subject }),
      }),
    );
  });

  it('rejects deletion if the displayed impact changed before commit', async () => {
    const remove = jest.fn();
    const tx = {
      $queryRaw: jest.fn(),
      resume: {
        findFirst: jest
          .fn()
          .mockResolvedValue({ id: resumeId, isPrimary: true }),
        delete: remove,
      },
      application: { count: jest.fn().mockResolvedValue(2) },
    };
    const service = new ResumeService(
      { $transaction: (run: (tx: unknown) => unknown) => run(tx) } as never,
      {} as never,
    );
    await expect(
      service.remove(subject, {
        resumeId,
        expectedImpact: { isPrimary: true, applicationCount: 1 },
      }),
    ).rejects.toMatchObject({ code: 'CONFLICT' });
    expect(remove).not.toHaveBeenCalled();
    await expect(
      service.remove(subject, {
        resumeId,
        expectedImpact: { isPrimary: true, applicationCount: 2 },
      }),
    ).resolves.toEqual({ success: true });
    expect(remove).toHaveBeenCalledWith({ where: { id: resumeId } });
  });
});

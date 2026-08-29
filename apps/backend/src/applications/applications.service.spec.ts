import { ApplicationsService } from './applications.service';

const subject = '00000000-0000-4000-8000-000000000001';
const rows = [
  {
    id: '00000000-0000-4000-8000-000000000011',
    companyName: 'Palea',
    role: 'Engineer',
    appliedOn: new Date('2026-08-20'),
    status: 'draft',
    workMode: 'remote',
    position: 0,
  },
  {
    id: '00000000-0000-4000-8000-000000000012',
    companyName: 'Palea',
    role: 'Designer',
    appliedOn: new Date('2026-08-19'),
    status: 'draft',
    workMode: 'hybrid',
    position: 1,
  },
];

describe('ApplicationsService', () => {
  it('returns an owner-scoped, stable page without skipping the next item', async () => {
    const findMany = jest.fn().mockResolvedValue(rows);
    const service = new ApplicationsService({
      application: { findMany, count: jest.fn().mockResolvedValue(2) },
    } as never);

    const page = await service.list(subject, { status: 'draft', limit: 1 });

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ profileId: subject, status: 'draft' }),
        take: 2,
      }),
    );
    expect(page.items).toHaveLength(1);
    expect(page.nextCursor).toBe(rows[0]?.id);
  });

  it('does not update an application that is not owned by the candidate', async () => {
    const service = new ApplicationsService({
      $transaction: (run: (transaction: unknown) => Promise<unknown>) =>
        run({
          $executeRaw: jest.fn(),
          application: { findFirst: jest.fn().mockResolvedValue(null) },
        }),
    } as never);
    await expect(
      service.updateStatus(subject, rows[0]!.id, 'offer'),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('persists insertion between destination cards', async () => {
    const update = jest.fn().mockResolvedValue({});
    const transaction = {
      $executeRaw: jest.fn(),
      application: {
        findFirst: jest.fn().mockResolvedValue(rows[1]),
        findMany: jest.fn().mockResolvedValue([
          rows[0],
          rows[1],
          {
            ...rows[0],
            id: '00000000-0000-4000-8000-000000000013',
            status: 'offer',
            position: 0,
          },
          {
            ...rows[0],
            id: '00000000-0000-4000-8000-000000000014',
            status: 'offer',
            position: 1,
          },
        ]),
        update,
      },
    };
    const service = new ApplicationsService({
      $transaction: (run: (client: typeof transaction) => Promise<unknown>) =>
        run(transaction),
    } as never);

    await service.updateStatus(subject, rows[1]!.id, 'offer', 1);

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: rows[1]!.id },
        data: expect.objectContaining({ status: 'offer', position: 1 }),
      }),
    );
  });

  it('creates an owner-scoped draft atomically and sanitizes the description', async () => {
    const create = jest.fn().mockResolvedValue({
      ...rows[0],
      appliedOn: null,
      position: 2,
    });
    const createNote = jest.fn().mockResolvedValue({});
    const createCompensations = jest.fn().mockResolvedValue({ count: 1 });
    const transaction = {
      $executeRaw: jest.fn(),
      resume: { findFirst: jest.fn().mockResolvedValue({ id: 'resume-id' }) },
      application: {
        aggregate: jest.fn().mockResolvedValue({ _max: { position: 1 } }),
        create,
      },
      applicationNote: { create: createNote },
      applicationCompensation: { createMany: createCompensations },
    };
    const service = new ApplicationsService({
      $transaction: (run: (client: typeof transaction) => Promise<unknown>) =>
        run(transaction),
    } as never);

    const result = await service.create(subject, {
      companyName: 'Palea',
      role: 'Engineer',
      appliedOn: null,
      workMode: 'remote',
      commitment: 'full_time',
      contractType: 'employment',
      durationType: 'indefinite',
      resumeId: 'resume-id',
      jobDescription: {
        source: 'manual',
        html: '<h1>Title</h1><h2>Role</h2><script>alert(1)</script><a href="javascript:alert(2)">Apply</a>',
      },
      expectedCompensation: {
        minimumMinor: '100000',
        maximumMinor: null,
        currency: 'USD',
        period: 'month',
      },
      offeredCompensation: null,
      privateNotes: ' Follow up Friday ',
      timeZone: 'UTC',
    });

    expect(transaction.$executeRaw).toHaveBeenCalledTimes(1);
    expect(create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        profileId: subject,
        status: 'draft',
        position: 2,
        appliedOn: null,
        descriptionHtml: '<h1>Title</h1><h2>Role</h2><a>Apply</a>',
        description: 'TITLE\n\nROLE\n\nApply',
        descriptionCaptureStatus: 'completed',
      }),
    });
    expect(createNote).toHaveBeenCalledWith({
      data: { applicationId: rows[0]!.id, body: 'Follow up Friday' },
    });
    expect(createCompensations).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          applicationId: rows[0]!.id,
          kind: 'expected',
          minimumMinor: 100000n,
        }),
      ],
    });
    expect(result.status).toBe('draft');
  });

  it('rejects leaving draft without an application date', async () => {
    const transaction = {
      $executeRaw: jest.fn(),
      application: {
        findFirst: jest.fn().mockResolvedValue({ ...rows[0], appliedOn: null }),
      },
    };
    const service = new ApplicationsService({
      $transaction: (run: (client: typeof transaction) => Promise<unknown>) =>
        run(transaction),
    } as never);

    await expect(
      service.updateStatus(subject, rows[0]!.id, 'applied'),
    ).rejects.toMatchObject({ appCode: 'applications.date_required' });
  });

  it('rejects future application dates before opening a transaction', async () => {
    const transaction = jest.fn();
    const service = new ApplicationsService({
      $transaction: transaction,
    } as never);

    await expect(
      service.create(subject, {
        companyName: 'Palea',
        role: 'Engineer',
        appliedOn: '2999-01-01',
        workMode: 'unspecified',
        commitment: 'unspecified',
        contractType: 'unspecified',
        durationType: 'unspecified',
        resumeId: null,
        jobDescription: null,
        expectedCompensation: null,
        offeredCompensation: null,
        privateNotes: '',
        timeZone: 'UTC',
      }),
    ).rejects.toMatchObject({ appCode: 'applications.future_date' });
    expect(transaction).not.toHaveBeenCalled();
  });

  it('validates application dates against the candidate device timezone', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-08-28T00:30:00.000Z'));
    const transaction = jest.fn().mockImplementation(async (run) =>
      run({
        $executeRaw: jest.fn(),
        application: {
          aggregate: jest.fn().mockResolvedValue({ _max: { position: -1 } }),
          create: jest.fn().mockResolvedValue({
            ...rows[0],
            appliedOn: new Date('2026-08-28'),
          }),
        },
      }),
    );
    const service = new ApplicationsService({
      $transaction: transaction,
    } as never);
    const input = {
      companyName: 'Palea',
      role: 'Engineer',
      appliedOn: '2026-08-28',
      workMode: 'unspecified' as const,
      commitment: 'unspecified' as const,
      contractType: 'unspecified' as const,
      durationType: 'unspecified' as const,
      resumeId: null,
      jobDescription: null,
      expectedCompensation: null,
      offeredCompensation: null,
      privateNotes: '',
      timeZone: 'Asia/Tokyo',
    };
    await expect(service.create(subject, input)).resolves.toMatchObject({
      status: 'draft',
    });
    await expect(
      service.create(subject, { ...input, timeZone: 'America/Los_Angeles' }),
    ).rejects.toMatchObject({ appCode: 'applications.future_date' });
    await expect(
      service.updateStatus(
        subject,
        rows[0]!.id,
        'applied',
        undefined,
        '2026-08-28',
        'America/Los_Angeles',
      ),
    ).rejects.toMatchObject({ appCode: 'applications.future_date' });
    jest.useRealTimers();
  });
});

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
        run({ application: { findFirst: jest.fn().mockResolvedValue(null) } }),
    } as never);
    await expect(
      service.updateStatus(subject, rows[0]!.id, 'offer'),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('persists insertion between destination cards', async () => {
    const update = jest.fn().mockResolvedValue({});
    const transaction = {
      application: {
        findFirst: jest.fn().mockResolvedValue(rows[1]),
        findMany: jest
          .fn()
          .mockResolvedValue([
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
});

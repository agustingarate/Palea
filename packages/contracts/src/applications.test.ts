import {
  applicationListInputSchema,
  applicationPageSchema,
  updateApplicationStatusInputSchema,
} from './applications';

const id = '00000000-0000-4000-8000-000000000001';

describe('application contracts', () => {
  it('accepts a bounded status page request', () => {
    expect(
      applicationListInputSchema.parse({ status: 'applied', limit: 10 }),
    ).toMatchObject({ status: 'applied', limit: 10 });
    expect(
      applicationListInputSchema.parse({ status: 'applied' }),
    ).toMatchObject({ status: 'applied', limit: 25 });
  });
  it('rejects unsafe search and invalid status changes', () => {
    expect(
      applicationListInputSchema.safeParse({ status: 'other' }).success,
    ).toBe(false);
    expect(
      updateApplicationStatusInputSchema.safeParse({
        applicationId: id,
        status: 'archived',
      }).success,
    ).toBe(false);
  });
  it('accepts a bounded insertion index for status moves', () => {
    expect(
      updateApplicationStatusInputSchema.parse({
        applicationId: id,
        status: 'offer',
        targetIndex: 2,
      }),
    ).toMatchObject({ targetIndex: 2 });
    expect(
      updateApplicationStatusInputSchema.safeParse({
        applicationId: id,
        status: 'offer',
        targetIndex: -1,
      }).success,
    ).toBe(false);
  });
  it('keeps pagination and status data explicit', () => {
    expect(
      applicationPageSchema.parse({
        items: [
          {
            id,
            companyName: 'Palea',
            role: 'Engineer',
            appliedOn: '2026-08-22',
            status: 'draft',
            workMode: 'remote',
            position: 0,
          },
        ],
        nextCursor: null,
        total: 1,
      }).total,
    ).toBe(1);
  });
});

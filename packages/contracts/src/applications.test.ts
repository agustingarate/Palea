import {
  applicationListInputSchema,
  applicationDetailSchema,
  applicationResourceSchema,
  applicationResumeInputSchema,
  applicationPageSchema,
  createApplicationInputSchema,
  currencyCodes,
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
        status: 'offer',
        timeZone: 'Not/AZone',
      }).success,
    ).toBe(false);
    expect(
      updateApplicationStatusInputSchema.safeParse({
        applicationId: id,
        status: 'archived',
        timeZone: 'UTC',
      }).success,
    ).toBe(false);
  });
  it('accepts a bounded insertion index for status moves', () => {
    expect(
      updateApplicationStatusInputSchema.parse({
        applicationId: id,
        status: 'offer',
        targetIndex: 2,
        timeZone: 'UTC',
      }),
    ).toMatchObject({ targetIndex: 2 });
    expect(
      updateApplicationStatusInputSchema.safeParse({
        applicationId: id,
        status: 'offer',
        targetIndex: -1,
        timeZone: 'UTC',
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

  it('creates a minimal draft input with safe defaults', () => {
    expect(
      createApplicationInputSchema.parse({
        companyName: ' Palea ',
        role: ' Engineer ',
        timeZone: 'UTC',
      }),
    ).toMatchObject({
      companyName: 'Palea',
      role: 'Engineer',
      appliedOn: null,
      workMode: 'unspecified',
      commitment: 'unspecified',
      contractType: 'unspecified',
      durationType: 'unspecified',
      resumeId: null,
    });
  });

  it('accepts one-sided ISO compensation ranges and rejects reversed bounds', () => {
    expect(currencyCodes).toContain('ARS');
    expect(
      createApplicationInputSchema.safeParse({
        companyName: 'Palea',
        role: 'Engineer',
        timeZone: 'UTC',
        expectedCompensation: {
          minimumMinor: '100000',
          currency: 'ARS',
          period: 'month',
        },
      }).success,
    ).toBe(true);
    expect(
      createApplicationInputSchema.safeParse({
        companyName: 'Palea',
        role: 'Engineer',
        timeZone: 'UTC',
        offeredCompensation: {
          minimumMinor: '200',
          maximumMinor: '100',
          currency: 'USD',
          period: 'hour',
        },
      }).success,
    ).toBe(false);
  });

  it('bounds minor amounts to signed PostgreSQL bigint', () => {
    const base = { companyName: 'Palea', role: 'Engineer', timeZone: 'UTC' };
    expect(
      createApplicationInputSchema.safeParse({
        ...base,
        expectedCompensation: {
          minimumMinor: '9223372036854775807',
          maximumMinor: '9223372036854775807',
          currency: 'USD',
          period: 'month',
        },
      }).success,
    ).toBe(true);
    for (const field of ['minimumMinor', 'maximumMinor'] as const) {
      expect(
        createApplicationInputSchema.safeParse({
          ...base,
          offeredCompensation: {
            [field]: '9223372036854775808',
            currency: 'USD',
            period: 'month',
          },
        }).success,
      ).toBe(false);
    }
  });

  it('keeps URL and image capture out of the executable create contract', () => {
    expect(
      createApplicationInputSchema.safeParse({
        companyName: 'Palea',
        role: 'Engineer',
        timeZone: 'UTC',
        jobDescription: { source: 'url', url: 'https://example.com/job' },
      }).success,
    ).toBe(false);
  });

  it('validates the nullable detail fields, CV association and HTTP(S) resources', () => {
    expect(
      applicationResumeInputSchema.safeParse({
        applicationId: 'invalid',
        resumeId: null,
      }).success,
    ).toBe(false);
    expect(
      applicationResourceSchema.safeParse({
        id,
        name: 'Portfolio',
        url: 'ftp://example.com',
        resourceType: null,
      }).success,
    ).toBe(false);
    expect(
      applicationDetailSchema.parse({
        id,
        companyName: 'Palea',
        role: 'Engineer',
        appliedOn: null,
        status: 'draft',
        workMode: 'unspecified',
        position: 0,
        commitment: 'unspecified',
        contractType: 'unspecified',
        durationType: 'unspecified',
        url: null,
        location: null,
        schedule: null,
        descriptionHtml: null,
        description: null,
        skillAnalysisStatus: 'not_requested',
        requiredSkills: [],
        resume: null,
        compensations: [
          {
            kind: 'expected',
            minimumMinor: '1000',
            maximumMinor: null,
            currency: 'USD',
            period: 'month',
          },
        ],
      }).compensations,
    ).toHaveLength(1);
  });
});

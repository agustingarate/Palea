import {
  applicationListInputSchema,
  applicationDetailSchema,
  applicationResourceSchema,
  applicationResumeInputSchema,
  applicationPageSchema,
  applicationStageSchema,
  createApplicationStageInputSchema,
  createApplicationInputSchema,
  updateApplicationInputSchema,
  currencyCodes,
  updateApplicationStatusInputSchema,
  updateApplicationStageInputSchema,
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

  it('shares normalized editable fields across create and update inputs', () => {
    const input = updateApplicationInputSchema.parse({
      applicationId: id,
      companyName: ' Palea ',
      role: ' Engineer ',
      url: 'https://example.com/jobs/1',
      location: ' Córdoba ',
      schedule: ' 9 to 18 ',
      timeZone: 'UTC',
    });
    expect(input).toMatchObject({
      companyName: 'Palea',
      role: 'Engineer',
      url: 'https://example.com/jobs/1',
      location: 'Córdoba',
      schedule: '9 to 18',
      appliedOn: null,
    });
    expect(
      updateApplicationInputSchema.safeParse({
        ...input,
        url: 'ftp://example.com/jobs/1',
      }).success,
    ).toBe(false);
    expect(
      updateApplicationInputSchema.safeParse({
        ...input,
        location: 'x'.repeat(201),
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

  it('normalizes a pending stage and bounds its persisted fields', () => {
    expect(
      createApplicationStageInputSchema.parse({
        applicationId: id,
        name: '  Technical interview  ',
        questions: '  ',
        comments: ' Prepared system design ',
      }),
    ).toMatchObject({
      name: 'Technical interview',
      eventOn: null,
      result: 'pending',
      difficulty: null,
      questions: null,
      comments: 'Prepared system design',
    });
    expect(
      createApplicationStageInputSchema.safeParse({
        applicationId: id,
        name: 'x'.repeat(121),
      }).success,
    ).toBe(false);
  });

  it('requires date and difficulty outside pending and clears both invariants', () => {
    const base = { applicationId: id, name: 'Interview' };
    expect(
      createApplicationStageInputSchema.safeParse({
        ...base,
        result: 'waiting',
      }).success,
    ).toBe(false);
    expect(
      createApplicationStageInputSchema.safeParse({
        ...base,
        eventOn: '2026-08-29',
        result: 'successful',
        difficulty: 'easy',
      }).success,
    ).toBe(true);
    expect(
      createApplicationStageInputSchema.safeParse({
        ...base,
        result: 'pending',
        difficulty: 'easy',
      }).success,
    ).toBe(false);
  });

  it('validates stage identity and the complete output contract', () => {
    expect(
      updateApplicationStageInputSchema.safeParse({
        applicationId: id,
        stageId: 'invalid',
        name: 'Interview',
      }).success,
    ).toBe(false);
    expect(
      'details' in
        applicationStageSchema.parse({
          id,
          applicationId: id,
          name: 'Interview',
          eventOn: null,
          result: 'pending',
          difficulty: null,
          questions: null,
          comments: null,
          createdAt: '2026-08-29T12:00:00.000Z',
          updatedAt: '2026-08-29T12:00:00.000Z',
        }),
    ).toBe(false);
  });
});

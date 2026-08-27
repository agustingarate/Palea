import {
  applicationCreateFormSchema,
  majorToMinor,
  toCreateApplicationInput,
} from './applicationCreateModel';

describe('application create form mapping', () => {
  it('converts major amounts without floating point arithmetic', () => {
    expect(majorToMinor('1234.56', 2)).toBe('123456');
    expect(majorToMinor('10,5', 2)).toBe('1050');
    expect(() => majorToMinor('1.001', 2)).toThrow('validation.salary.precision');
    expect(() => majorToMinor('0', 2)).toThrow('validation.salary.positive');
    expect(() => majorToMinor('92233720368547758.08', 2)).toThrow(
      'validation.salary.range',
    );
  });

  it('keeps application date and compensation optional for a draft', () => {
    expect(
      toCreateApplicationInput({
        companyName: 'Palea',
        role: 'Engineer',
        appliedOn: null,
        jobDescriptionHtml: '',
        workMode: 'unspecified',
        commitment: 'unspecified',
        contractType: 'unspecified',
        durationType: 'unspecified',
        resumeId: null,
        expectedMinimum: '',
        expectedMaximum: '',
        expectedCurrency: 'USD',
        expectedPeriod: 'month',
        offeredMinimum: '',
        offeredMaximum: '',
        offeredCurrency: 'USD',
        offeredPeriod: 'month',
        privateNotes: '',
      }),
    ).toMatchObject({
      appliedOn: null,
      expectedCompensation: null,
      offeredCompensation: null,
    });
  });

  it('reports compensation invariants on their corresponding fields', () => {
    const result = applicationCreateFormSchema.safeParse({
      companyName: 'Palea',
      role: 'Engineer',
      appliedOn: null,
      jobDescriptionHtml: '',
      workMode: 'unspecified',
      commitment: 'unspecified',
      contractType: 'unspecified',
      durationType: 'unspecified',
      resumeId: null,
      expectedMinimum: '0',
      expectedMaximum: '1.001',
      expectedCurrency: 'USD',
      expectedPeriod: 'month',
      offeredMinimum: '200',
      offeredMaximum: '100',
      offeredCurrency: 'USD',
      offeredPeriod: 'month',
      privateNotes: '',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ['expectedMinimum'],
            message: 'validation.salary.positive',
          }),
          expect.objectContaining({
            path: ['expectedMaximum'],
            message: 'validation.salary.precision',
          }),
          expect.objectContaining({
            path: ['offeredMaximum'],
            message: 'validation.salary.maximumBeforeMinimum',
          }),
        ]),
      );
    }
  });
});

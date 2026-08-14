import {
  completeRegistrationInputSchema,
  healthSchema,
  passwordSchema,
  projectDtoSchema,
  saveWorkExperienceInputSchema,
} from './index';

it('parses public boundary contracts', () => {
  expect(healthSchema.parse({ status: 'ok' })).toEqual({ status: 'ok' });
  expect(() =>
    projectDtoSchema.parse({
      id: '',
      name: '',
      company: '',
      status: 'unknown',
      updatedAt: 'today',
    }),
  ).toThrow();
});

describe('auth and onboarding contracts', () => {
  it('enforces password complexity', () => {
    expect(passwordSchema.safeParse('Password1').success).toBe(true);
    expect(passwordSchema.safeParse('password').success).toBe(false);
  });

  it('validates ISO personal data', () => {
    expect(
      completeRegistrationInputSchema.safeParse({
        fullName: 'Ada Lovelace',
        birthDate: '1990-12-10',
        nationality: 'AR',
      }).success,
    ).toBe(true);
    expect(
      completeRegistrationInputSchema.safeParse({
        fullName: 'Ada Lovelace',
        birthDate: '1990-12-10',
        nationality: 'Argentina',
      }).success,
    ).toBe(false);
  });

  it('rejects invalid work ranges', () => {
    expect(
      saveWorkExperienceInputSchema.safeParse({
        companyName: 'Palea',
        role: 'Engineer',
        startedOn: '2025-01-01',
        endedOn: '2024-01-01',
        isCurrent: false,
      }).success,
    ).toBe(false);
  });
});

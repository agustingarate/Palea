import {
  isAtLeastAge,
  registrationInputSchema,
  reserveResumeUploadInputSchema,
  saveSkillsInputSchema,
  saveWorkExperienceInputSchema,
} from './auth';

const id = '00000000-0000-4000-8000-000000000001';

describe('auth contracts', () => {
  it('requires a strong matching password for registration', () => {
    const result = registrationInputSchema.safeParse({
      fullName: 'Ada Lovelace',
      email: 'ada@example.com',
      password: 'Password1',
      repeatPassword: 'OtherPass1',
      birthDate: '1990-01-31',
      nationality: 'AR',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ['repeatPassword'],
            message: 'password.mismatch',
          }),
        ]),
      );
    }
  });

  it('calculates the minimum age at an exact calendar boundary', () => {
    expect(isAtLeastAge('2008-08-14', 18, new Date('2026-08-14T12:00:00Z'))).toBe(true);
    expect(isAtLeastAge('2008-08-15', 18, new Date('2026-08-14T12:00:00Z'))).toBe(false);
  });

  it('rejects duplicate skills and invalid current work dates', () => {
    expect(
      saveSkillsInputSchema.safeParse({ skillIds: [id, id] }).success,
    ).toBe(false);
    expect(
      saveWorkExperienceInputSchema.safeParse({
        companyName: 'Palea',
        role: 'Engineer',
        startedOn: '2024-01-01',
        endedOn: '2024-02-01',
        isCurrent: true,
      }).success,
    ).toBe(false);
  });

  it('limits resume reservations to PDF files of at most 10 MiB', () => {
    expect(
      reserveResumeUploadInputSchema.safeParse({
        displayName: 'cv.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 10 * 1024 * 1024 + 1,
      }).success,
    ).toBe(false);
  });
});

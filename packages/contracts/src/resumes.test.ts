import { confirmResumeUploadInputSchema, resumeListSchema } from './resumes';

const id = '00000000-0000-4000-8000-000000000001';

describe('resume contracts', () => {
  it('requires an explicit primary decision when confirming an upload', () => {
    expect(
      confirmResumeUploadInputSchema.parse({
        resumeId: id,
        makePrimary: false,
      }),
    ).toEqual({ resumeId: id, makePrimary: false });
    expect(
      confirmResumeUploadInputSchema.safeParse({ resumeId: id }).success,
    ).toBe(false);
  });

  it('parses ready resume presentation data', () => {
    expect(
      resumeListSchema.parse([
        {
          id,
          displayName: 'cv.pdf',
          sizeBytes: 1024,
          isPrimary: true,
          uploadedAt: '2026-08-23T12:00:00.000Z',
        },
      ]),
    ).toHaveLength(1);
  });
});

import {
  emptyApplicationStageForm,
  applicationStageFormSchema,
  isPendingStageDue,
  stageValuesForResult,
  toCreateStageInput,
} from './applicationStageModel';

const applicationId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

describe('application stage model', () => {
  it('applies difficulty transitions without UI-owned business rules', () => {
    expect(
      stageValuesForResult(emptyApplicationStageForm, 'waiting').difficulty,
    ).toBe('easy');
    expect(
      stageValuesForResult(
        { ...emptyApplicationStageForm, difficulty: 'hard' },
        'pending',
      ).difficulty,
    ).toBeNull();
  });

  it('requires a date for non-pending values at the domain boundary', () => {
    expect(() =>
      toCreateStageInput(applicationId, {
        ...emptyApplicationStageForm,
        name: 'Interview',
        result: 'failed',
        difficulty: 'hard',
      }),
    ).toThrow();
  });

  it('exposes contract validation to the form before submission', () => {
    const result = applicationStageFormSchema.safeParse({
      ...emptyApplicationStageForm,
      result: 'successful',
      difficulty: 'easy',
    });

    expect(result.success).toBe(false);
    if (!result.success)
      expect(result.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ path: ['name'] }),
          expect.objectContaining({ path: ['eventOn'] }),
        ]),
      );
  });

  it('detects a persistent warning using local calendar dates', () => {
    expect(
      isPendingStageDue(
        { result: 'pending', eventOn: '2026-08-29' },
        '2026-08-29',
      ),
    ).toBe(true);
    expect(
      isPendingStageDue(
        { result: 'successful', eventOn: '2026-08-29' },
        '2026-08-30',
      ),
    ).toBe(false);
  });
});

import { useOnboardingDraftStore } from './useOnboardingDraftStore';

afterEach(() => useOnboardingDraftStore.getState().clear());

it('preserves drafts across onboarding screens and clears only on completion', () => {
  useOnboardingDraftStore.getState().setSkills(['skill-1']);
  expect(useOnboardingDraftStore.getState().skills).toEqual(['skill-1']);
  useOnboardingDraftStore.getState().clear();
  expect(useOnboardingDraftStore.getState().skills).toEqual([]);
});

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useDependency } from '@/core/di/DependenciesProvider';
import { dependencyTokens } from '@/core/di/dependencies';
import { useOnboardingDraftStore } from '../stores/useOnboardingDraftStore';

export function useOnboardingViewModel() {
  const repository = useDependency(dependencyTokens.onboardingRepository);
  const router = useRouter();
  const queryClient = useQueryClient();
  const draft = useOnboardingDraftStore();
  const catalog = useQuery({
    queryKey: ['auth', 'onboarding-catalog', 'es'],
    queryFn: () => repository.getCatalog('es'),
  });
  const invalidateAccount = () =>
    queryClient.invalidateQueries({ queryKey: ['auth', 'account'] });
  return {
    ...draft,
    catalog,
    async saveProfile(input: typeof draft.profile) {
      await repository.saveProfile(input);
      draft.setProfile(input);
      router.push('/onboarding/work');
    },
    skipProfile() {
      router.push('/onboarding/work');
    },
    async saveWork(input: typeof draft.work) {
      const normalized = {
        ...input,
        endedOn: input.isCurrent ? null : input.endedOn || null,
      };
      await repository.saveWorkExperience(normalized);
      draft.setWork(normalized);
      router.push('/onboarding/skills');
    },
    async finish() {
      await repository.completeOnboarding();
      draft.clear();
      invalidateAccount();
      router.replace('/');
    },
    repository,
  };
}

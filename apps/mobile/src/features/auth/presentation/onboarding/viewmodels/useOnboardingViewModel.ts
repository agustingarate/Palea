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
  const catalog = useQuery({ queryKey: ['auth', 'onboarding-catalog', 'es'], queryFn: () => repository.getCatalog('es') });
  const invalidateAccount = () => queryClient.invalidateQueries({ queryKey: ['auth', 'account'] });
  return {
    ...draft, catalog, 
    async saveProfile() { await repository.saveProfile(draft.profile); router.push('/onboarding/work'); },
    async saveWork() { await repository.saveWorkExperience({ ...draft.work, endedOn: draft.work.isCurrent ? null : draft.work.endedOn || null }); router.push('/onboarding/skills'); },
    async finish(skipped: boolean) { await repository.completeOnboarding({ skipped }); draft.clear(); invalidateAccount(); router.replace('/'); },
    repository,
  };
}

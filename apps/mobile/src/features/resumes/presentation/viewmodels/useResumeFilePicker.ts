import { useMutation, useQuery } from '@tanstack/react-query';
import { useDependency } from '@/core/di/DependenciesProvider';
import { dependencyTokens } from '@/core/di/dependencies';

export function useResumeFilePicker() {
  const picker = useDependency(dependencyTokens.pickResumeFile);
  const repository = useDependency(dependencyTokens.resumeRepository);
  const policy = useQuery({
    queryKey: ['resumes', 'policy'],
    queryFn: () => repository.policy(),
  });
  const selection = useMutation({
    mutationFn: async () => {
      const effectivePolicy = policy.data ?? (await policy.refetch()).data;
      if (!effectivePolicy) throw new Error('resume.policyUnavailable');
      return picker.execute(effectivePolicy);
    },
  });
  return { policy, selection };
}

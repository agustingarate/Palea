import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useDependency } from '@/core/di/DependenciesProvider';
import { dependencyTokens } from '@/core/di/dependencies';
import { useResumeFilePicker } from '@/features/resumes/presentation/viewmodels/useResumeFilePicker';
import { useOnboardingViewModel } from './useOnboardingViewModel';

export function useOnboardingSkillsViewModel() {
  const vm = useOnboardingViewModel();
  const repository = useDependency(dependencyTokens.resumeRepository);
  const resumes = useQuery({
    queryKey: ['resumes', 'ready'],
    queryFn: () => repository.list(),
  });
  const picker = useResumeFilePicker();
  const queryClient = useQueryClient();
  const [uploadProgress, setUploadProgress] = useState(0);
  const upload = useMutation({
    mutationFn: async () => {
      const file = await picker.selection.mutateAsync();
      if (!file) return null;
      setUploadProgress(0);
      await vm.repository.uploadResume(
        {
          displayName: file.name,
          mimeType: file.mimeType,
          sizeBytes: file.sizeBytes,
        },
        file,
        setUploadProgress,
      );
      await queryClient.invalidateQueries({ queryKey: ['resumes'] });
      return { name: file.name };
    },
  });
  const finish = useMutation({
    mutationFn: async (skip: boolean) => {
      if (!skip) await vm.repository.saveSkills({ skillIds: vm.skills });
      await vm.finish();
    },
  });
  return {
    ...vm,
    upload,
    uploadProgress,
    finish,
    policy: picker.policy,
    primaryResume: resumes.data?.find((resume) => resume.isPrimary),
  };
}

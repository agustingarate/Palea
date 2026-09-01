import { useCallback, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useDependency } from '@/core/di/DependenciesProvider';
import { dependencyTokens } from '@/core/di/dependencies';
import type { ResumeUploadFile } from '../../domain/repositories/ResumeRepository';
import { useResumeFilePicker } from './useResumeFilePicker';

export const resumeLibraryKeys = {
  all: ['resumes'] as const,
  list: ['resumes', 'ready'] as const,
  policy: ['resumes', 'policy'] as const,
};

export function useResumeLibraryViewModel() {
  const repository = useDependency(dependencyTokens.resumeRepository);
  const picker = useResumeFilePicker();
  const queryClient = useQueryClient();
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const resumes = useQuery({
    queryKey: resumeLibraryKeys.list,
    queryFn: () => repository.list(),
  });
  const policy = useQuery({
    queryKey: resumeLibraryKeys.policy,
    queryFn: () => repository.policy(),
  });
  const refresh = useCallback(
    () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: resumeLibraryKeys.list }),
        queryClient.invalidateQueries({ queryKey: resumeLibraryKeys.policy }),
        queryClient.invalidateQueries({ queryKey: ['applications'] }),
      ]),
    [queryClient],
  );
  const upload = useMutation({
    mutationFn: async (file: ResumeUploadFile) => {
      setUploadProgress(0);
      const result = await repository.upload(
        {
          displayName: file.name,
          mimeType: file.mimeType,
          sizeBytes: file.sizeBytes,
        },
        file,
        {
          primaryMode: 'if_missing',
          onProgress: setUploadProgress,
        },
      );
      return result;
    },
    onSuccess: refresh,
    onSettled: () => setUploadProgress(null),
  });
  const rename = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      repository.rename(id, name),
    onSuccess: refresh,
  });
  const setPrimary = useMutation({
    mutationFn: (resumeId: string) => repository.setPrimary(resumeId),
    onSuccess: refresh,
  });
  const remove = useMutation({
    mutationFn: (input: Parameters<typeof repository.delete>[0]) =>
      repository.delete(input),
    onSuccess: refresh,
  });
  const requestDeleteImpact = useCallback(
    (resumeId: string) => repository.deleteImpact(resumeId),
    [repository],
  );
  const createDownload = useCallback(
    (resumeId: string) => repository.createDownload(resumeId),
    [repository],
  );

  const chooseFile = useCallback(async () => {
    const file = await picker.selection.mutateAsync();
    if (!file) return false;
    await upload.mutateAsync(file);
    return true;
  }, [picker.selection, upload]);

  return {
    resumes,
    policy,
    upload,
    uploadProgress,
    rename,
    setPrimary,
    remove,
    requestDeleteImpact,
    createDownload,
    chooseFile,
    atLimit: Boolean(
      policy.data && policy.data.usedResumes >= policy.data.maxResumes,
    ),
  };
}

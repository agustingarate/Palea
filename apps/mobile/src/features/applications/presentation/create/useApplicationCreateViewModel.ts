import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import type { ResumeUploadFile } from '@/features/resumes/domain/repositories/ResumeRepository';
import { useDependency } from '@/core/di/DependenciesProvider';
import { dependencyTokens } from '@/core/di/dependencies';

export function useApplicationCreateViewModel() {
  const createApplication = useDependency(dependencyTokens.createApplication);
  const resumeRepository = useDependency(dependencyTokens.resumeRepository);
  const queryClient = useQueryClient();
  const [uploadProgress, setUploadProgress] = useState(0);
  const resumes = useQuery({
    queryKey: ['resumes', 'ready'],
    queryFn: () => resumeRepository.list(),
  });
  const upload = useMutation({
    mutationFn: (file: ResumeUploadFile) =>
      resumeRepository.upload(
        {
          displayName: file.name,
          mimeType: file.mimeType,
          sizeBytes: file.sizeBytes,
        },
        file,
        { makePrimary: false, onProgress: setUploadProgress },
      ),
    onMutate: () => setUploadProgress(0),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['resumes', 'ready'] }),
  });
  const create = useMutation({
    mutationFn: createApplication.execute.bind(createApplication),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['applications'] }),
  });

  return { resumes, upload, uploadProgress, create };
}

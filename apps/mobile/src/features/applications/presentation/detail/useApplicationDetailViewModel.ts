import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ResumeUploadFile } from '@/features/resumes/domain/repositories/ResumeRepository';
import { useDependency } from '@/core/di/DependenciesProvider';
import { dependencyTokens } from '@/core/di/dependencies';

const detailKey = (applicationId: string) =>
  ['applications', 'detail', applicationId] as const;

export function useApplicationDetailViewModel(applicationId: string) {
  const getDetail = useDependency(dependencyTokens.getApplicationDetail);
  const listStages = useDependency(dependencyTokens.listApplicationStages);
  const getNote = useDependency(dependencyTokens.getApplicationNote);
  const listResources = useDependency(
    dependencyTokens.listApplicationResources,
  );
  const updateResume = useDependency(dependencyTokens.updateApplicationResume);
  const updateStatus = useDependency(dependencyTokens.updateApplicationStatus);
  const deleteApplication = useDependency(dependencyTokens.deleteApplication);
  const resumeRepository = useDependency(dependencyTokens.resumeRepository);
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['applications'] });
  const detail = useQuery({
    queryKey: detailKey(applicationId),
    queryFn: () => getDetail.execute(applicationId),
  });
  const stages = useQuery({
    queryKey: [...detailKey(applicationId), 'stages'],
    queryFn: () => listStages.execute(applicationId),
  });
  const note = useQuery({
    queryKey: [...detailKey(applicationId), 'note'],
    queryFn: () => getNote.execute(applicationId),
  });
  const resources = useQuery({
    queryKey: [...detailKey(applicationId), 'resources'],
    queryFn: () => listResources.execute(applicationId),
  });
  const resumes = useQuery({
    queryKey: ['resumes', 'ready'],
    queryFn: () => resumeRepository.list(),
  });
  const status = useMutation({
    mutationFn: (input: Parameters<typeof updateStatus.execute>) =>
      updateStatus.execute(...input),
    onSuccess: invalidate,
  });
  const resume = useMutation({
    mutationFn: (resumeId: string | null) =>
      updateResume.execute(applicationId, resumeId),
    onSuccess: invalidate,
  });
  const upload = useMutation({
    mutationFn: async (file: ResumeUploadFile) => {
      const resumeId = await resumeRepository.upload(
        {
          displayName: file.name,
          mimeType: file.mimeType,
          sizeBytes: file.sizeBytes,
        },
        file,
        { makePrimary: false },
      );
      await updateResume.execute(applicationId, resumeId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resumes', 'ready'] });
      invalidate();
    },
  });
  const download = useMutation({
    mutationFn: (resumeId: string) => resumeRepository.createDownload(resumeId),
  });
  const remove = useMutation({
    mutationFn: () => deleteApplication.execute(applicationId),
    onSuccess: invalidate,
  });
  return {
    detail,
    stages,
    note,
    resources,
    resumes,
    status,
    resume,
    upload,
    download,
    remove,
  };
}

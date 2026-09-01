import { useMutation, useQuery } from '@tanstack/react-query';
import { Linking, Platform } from 'react-native';
import { useDependency } from '@/core/di/DependenciesProvider';
import { dependencyTokens } from '@/core/di/dependencies';

export function useResumePreview(resumeId: string | null) {
  const repository = useDependency(dependencyTokens.resumeRepository);
  const access = useQuery({
    queryKey: ['resumes', 'preview', resumeId],
    queryFn: () => repository.createPreview(resumeId!),
    enabled: Boolean(resumeId),
    staleTime: 30_000,
    gcTime: 0,
    retry: 1,
    refetchOnWindowFocus: false,
  });
  const download = useMutation({
    mutationFn: async (id: string) => {
      const url = await repository.createDownload(id);
      if (Platform.OS === 'web') {
        const link = document.createElement('a');
        link.href = url;
        link.download = '';
        link.rel = 'noopener noreferrer';
        document.body.append(link);
        link.click();
        link.remove();
      } else await Linking.openURL(url);
    },
  });
  const recoverAccess = () => {
    // Renew only a failed, expired access. A timer would interrupt active reading.
    if (
      resumeId &&
      access.data &&
      !access.isFetching &&
      Date.parse(access.data.expiresAt) <= Date.now()
    ) {
      void access.refetch();
    }
  };
  return { access, download, recoverAccess };
}

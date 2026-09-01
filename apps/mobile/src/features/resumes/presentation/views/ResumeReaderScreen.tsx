import { View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  FeedbackMessage,
  IconButton,
  Screen,
  TopAppBar,
  useSnackbar,
} from '@palea/ui-native';
import { useLocale } from '@/core/localization/LocaleProvider';
import { useDependency } from '@/core/di/DependenciesProvider';
import { dependencyTokens } from '@/core/di/dependencies';
import { PostAuthRouteGuard } from '@/features/auth/presentation/components/PostAuthRouteGuard';
import { ResumePdfPreview } from '../components/ResumePdfPreview';
import { useResumePreview } from '../viewmodels/useResumePreview';
import { resumeLibraryKeys } from '../viewmodels/useResumeLibraryViewModel';

export function ResumeReaderScreen() {
  return (
    <PostAuthRouteGuard>
      <ResumeReaderContent />
    </PostAuthRouteGuard>
  );
}
function ResumeReaderContent() {
  const { resumeId } = useLocalSearchParams<{ resumeId: string }>();
  const repository = useDependency(dependencyTokens.resumeRepository);
  const resumes = useQuery({
    queryKey: resumeLibraryKeys.list,
    queryFn: () => repository.list(),
  });
  const resume = resumes.data?.find((item) => item.id === resumeId);
  const { access, download, recoverAccess } = useResumePreview(
    resume?.id ?? null,
  );
  const router = useRouter();
  const { t } = useLocale('resumes');
  const { showSnackbar } = useSnackbar();
  const back = () =>
    router.canGoBack() ? router.back() : router.replace('/resumes');
  return (
    <Screen edges={['top', 'bottom']}>
      <View className="flex-1">
        <TopAppBar
          title={t('title')}
          leading={
            <IconButton
              icon="arrowBack"
              accessibilityLabel={t('return')}
              onPress={back}
            />
          }
        />
        {resumes.isError || (!resumes.isPending && !resume) ? (
          <View className="flex-1 justify-center p-6">
            <FeedbackMessage
              title={t('notFound')}
              message={t('errorMessage')}
              tone="danger"
              actionLabel={t('back')}
              onAction={back}
            />
          </View>
        ) : (
          <ResumePdfPreview
            key={resumeId}
            title={resume?.displayName ?? t('viewerLoading')}
            url={access.data?.signedUrl ?? null}
            loading={resumes.isPending || access.isFetching}
            error={access.isError}
            onRetry={() => void access.refetch()}
            onAccessError={recoverAccess}
            downloadPending={download.isPending}
            onDownload={() => {
              if (resume)
                void download.mutateAsync(resume.id).catch(() =>
                  showSnackbar({
                    variant: 'error',
                    message: t('downloadError'),
                  }),
                );
            }}
          />
        )}
      </View>
    </Screen>
  );
}

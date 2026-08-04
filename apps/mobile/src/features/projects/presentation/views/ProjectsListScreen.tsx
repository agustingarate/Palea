import { ActivityIndicator, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText, Button, ProjectList } from '@palea/ui-native';
import { useThemeStore, type ThemePreference } from '@/core/state/themeStore';
import { FeedbackState } from '@/common/presentation/FeedbackState';
import { useProjectsViewModel } from '../viewmodels/useProjectsViewModel';
import { useLocale } from '@/core/localization/LocaleProvider';

const nextTheme: Record<ThemePreference, ThemePreference> = {
  system: 'light',
  light: 'dark',
  dark: 'system',
};

export function ProjectsListScreen() {
  const viewModel = useProjectsViewModel();
  const { t: projectsT } = useLocale('projects');
  const { t: commonT } = useLocale('common');
  const preference = useThemeStore((state) => state.preference);
  const setPreference = useThemeStore((state) => state.setPreference);

  if (viewModel.isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background dark:bg-dark-background">
        <FeedbackState
          title={projectsT('loading.title')}
          message={projectsT('loading.message')}
        />
        <ActivityIndicator />
      </SafeAreaView>
    );
  }
  if (viewModel.error) {
    return (
      <SafeAreaView className="flex-1 bg-background dark:bg-dark-background">
        <FeedbackState
          title={projectsT('error.title')}
          message={projectsT('error.message')}
          actionLabel={projectsT('error.retry')}
          onAction={() => void viewModel.refresh()}
        />
      </SafeAreaView>
    );
  }
  if (viewModel.projects.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-background dark:bg-dark-background">
        <FeedbackState
          title={projectsT('empty.title')}
          message={projectsT('empty.message')}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-dark-background">
      <View className="flex-1 gap-6 px-4 pt-6">
        <View className="flex-row items-center justify-between gap-4">
          <View className="flex-1">
            <AppText variant="headline">{projectsT('title')}</AppText>
            <AppText muted>{projectsT('subtitle')}</AppText>
          </View>
          <Button
            label={commonT('theme.label', { theme: preference })}
            variant="ghost"
            onPress={() => setPreference(nextTheme[preference])}
          />
        </View>
        <ProjectList
          projects={viewModel.projects}
          refreshing={viewModel.isRefreshing}
          onRefresh={() => void viewModel.refresh()}
        />
      </View>
    </SafeAreaView>
  );
}

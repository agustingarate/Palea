import { ActivityIndicator, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText, Button, ProjectList } from '@palea/ui-native';
import { useThemeStore, type ThemePreference } from '@/core/state/themeStore';
import { FeedbackState } from '@/common/presentation/FeedbackState';
import { useProjectsViewModel } from '../viewmodels/useProjectsViewModel';

const nextTheme: Record<ThemePreference, ThemePreference> = {
  system: 'light',
  light: 'dark',
  dark: 'system',
};

export function ProjectsListScreen() {
  const viewModel = useProjectsViewModel();
  const preference = useThemeStore((state) => state.preference);
  const setPreference = useThemeStore((state) => state.setPreference);

  if (viewModel.isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background dark:bg-dark-background">
        <FeedbackState
          title="Cargando proyectos"
          message="Estamos preparando tu espacio de trabajo."
        />
        <ActivityIndicator />
      </SafeAreaView>
    );
  }
  if (viewModel.error) {
    return (
      <SafeAreaView className="flex-1 bg-background dark:bg-dark-background">
        <FeedbackState
          title="No pudimos cargar los proyectos"
          message="Revisa la conexión e inténtalo nuevamente."
          actionLabel="Reintentar"
          onAction={() => void viewModel.refresh()}
        />
      </SafeAreaView>
    );
  }
  if (viewModel.projects.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-background dark:bg-dark-background">
        <FeedbackState
          title="Todavía no hay proyectos"
          message="Tus búsquedas aparecerán aquí cuando agregues la primera."
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-dark-background">
      <View className="flex-1 gap-6 px-4 pt-6">
        <View className="flex-row items-center justify-between gap-4">
          <View className="flex-1">
            <AppText variant="headline">Proyectos</AppText>
            <AppText muted>Tu búsqueda laboral, en un solo lugar.</AppText>
          </View>
          <Button
            label={`Tema: ${preference}`}
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

import { FlatList, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import {
  ApplicationCard,
  AppText,
  Button,
  CollectionFeedback,
  Screen,
} from '@palea/ui-native';
import { useThemeStore, type ThemePreference } from '@/core/state/themeStore';
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
  const router = useRouter();

  return (
    <Screen>
      <View className="flex-1 gap-6 px-4 pt-6">
        <View className="gap-3">
          <View>
            <AppText variant="screenTitle">{projectsT('title')}</AppText>
            <AppText tone="muted">{projectsT('subtitle')}</AppText>
          </View>
          <View className="flex-row flex-wrap gap-2">
            <Button
              label={commonT('theme.label', { theme: preference })}
              variant="ghost"
              onPress={() => setPreference(nextTheme[preference])}
            />
            {__DEV__ ? (
              <Button
                label="UI kit"
                variant="secondary"
                onPress={() => router.push('/design-system' as Href)}
              />
            ) : null}
          </View>
        </View>
        {viewModel.isLoading ? (
          <CollectionFeedback status="loading" />
        ) : viewModel.error ? (
          <CollectionFeedback
            status="error"
            title={projectsT('error.title')}
            message={projectsT('error.message')}
            actionLabel={projectsT('error.retry')}
            onAction={() => void viewModel.refresh()}
          />
        ) : viewModel.projects.length === 0 ? (
          <CollectionFeedback
            status="empty"
            title={projectsT('empty.title')}
            message={projectsT('empty.message')}
          />
        ) : (
          <FlatList
            contentContainerClassName="gap-3 pb-8"
            data={[...viewModel.projects]}
            keyExtractor={(item) => item.id}
            onRefresh={() => void viewModel.refresh()}
            refreshing={viewModel.isRefreshing}
            renderItem={({ item }) => (
              <ApplicationCard
                title={item.name}
                company={item.company}
                status={item.status === 'active' ? 'Active' : 'Archived'}
                statusTone={
                  item.status === 'active' ? 'interaction' : 'neutral'
                }
                variant="list"
              />
            )}
          />
        )}
      </View>
    </Screen>
  );
}

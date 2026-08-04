import { FlatList } from 'react-native';
import { ProjectCard, type ProjectCardProps } from '../molecules/ProjectCard';

export interface ProjectListItem extends ProjectCardProps {
  id: string;
}

export interface ProjectListProps {
  projects: readonly ProjectListItem[];
  refreshing?: boolean;
  onRefresh?: () => void;
}

export function ProjectList({
  projects,
  refreshing = false,
  onRefresh,
}: ProjectListProps) {
  return (
    <FlatList
      accessibilityRole="list"
      contentContainerClassName="gap-3 pb-8"
      data={[...projects]}
      keyExtractor={(item) => item.id}
      onRefresh={onRefresh}
      refreshing={refreshing}
      renderItem={({ item }) => <ProjectCard {...item} />}
    />
  );
}

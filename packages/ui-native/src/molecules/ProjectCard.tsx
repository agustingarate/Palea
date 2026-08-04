import { View } from 'react-native';
import { AppText } from '../atoms/AppText';
import { Surface } from '../atoms/Surface';

export interface ProjectCardProps {
  name: string;
  company: string;
  status: 'active' | 'archived';
}

export function ProjectCard({ name, company, status }: ProjectCardProps) {
  return (
    <Surface accessibilityLabel={`${name}, ${company}, ${status}`}>
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1 gap-1">
          <AppText variant="title">{name}</AppText>
          <AppText muted>{company}</AppText>
        </View>
        <View className="bg-primary-subtle dark:bg-dark-primary-subtle rounded-sm px-2 py-1">
          <AppText variant="caption">
            {status === 'active' ? 'Activa' : 'Archivada'}
          </AppText>
        </View>
      </View>
    </Surface>
  );
}

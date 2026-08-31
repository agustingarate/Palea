import { Linking, Pressable, View } from 'react-native';
import { AppText } from '@palea/ui-native';

export function ResumePdfPreview({
  url,
  title,
  onDownload,
}: {
  url: string | null;
  title: string;
  onDownload: () => void;
}) {
  return (
    <View className="flex-1 items-center justify-center gap-3 px-6">
      <AppText variant="sectionTitle">{title}</AppText>
      <AppText tone="muted">Vista previa privada del documento</AppText>
      {url ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => void Linking.openURL(url)}
        >
          <AppText tone="interaction">Abrir PDF</AppText>
        </Pressable>
      ) : null}
      <Pressable accessibilityRole="button" onPress={onDownload}>
        <AppText tone="interaction">Descargar</AppText>
      </Pressable>
    </View>
  );
}

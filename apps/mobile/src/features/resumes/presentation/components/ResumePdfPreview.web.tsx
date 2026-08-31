import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
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
  const [loading, setLoading] = useState(Boolean(url));
  useEffect(() => setLoading(Boolean(url)), [url]);
  if (!url)
    return (
      <View className="bg-surface-container-low dark:bg-dark-surface-container-low flex-1 items-center justify-center gap-2">
        <AppText variant="sectionTitle">Seleccioná un CV</AppText>
        <AppText tone="muted">La vista previa aparecerá aquí.</AppText>
      </View>
    );
  return (
    <View className="bg-surface-container-low dark:bg-dark-surface-container-low flex-1">
      <View className="min-h-control-lg flex-row items-center gap-3 border-b border-border bg-surface px-4 dark:border-dark-border dark:bg-dark-surface">
        <AppText className="flex-1" variant="bodySmall" numberOfLines={1}>
          {title}
        </AppText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Descargar PDF"
          onPress={onDownload}
        >
          <AppText tone="interaction">Descargar</AppText>
        </Pressable>
      </View>
      {loading ? (
        <ActivityIndicator className="absolute left-0 right-0 top-20" />
      ) : null}
      {/* The signed URL is private and is rendered directly in the browser. */}
      <iframe
        title={title}
        src={url}
        onLoad={() => setLoading(false)}
        style={{ border: 0, flex: 1, height: '100%', width: '100%' }}
      />
    </View>
  );
}

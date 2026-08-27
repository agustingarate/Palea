import { lazy, Suspense } from 'react';
import { Platform, View } from 'react-native';
import { AppText } from '../atoms/AppText';
import type { RichTextEditorProps } from './RichTextEditorImpl';
import { RichTextEditorWebImpl } from './RichTextEditorWebImpl';

const RichTextEditorImpl = lazy(() =>
  import('./RichTextEditorImpl').then((module) => ({
    default: module.RichTextEditor,
  })),
);

export type { RichTextEditorProps } from './RichTextEditorImpl';

export function RichTextEditor(props: RichTextEditorProps) {
  if (Platform.OS === 'web') return <RichTextEditorWebImpl {...props} />;
  return (
    <Suspense
      fallback={
        <View className="border-border min-h-56 justify-center rounded-md border p-4">
          <AppText tone="muted">{props.label}</AppText>
        </View>
      }
    >
      <RichTextEditorImpl {...props} />
    </Suspense>
  );
}

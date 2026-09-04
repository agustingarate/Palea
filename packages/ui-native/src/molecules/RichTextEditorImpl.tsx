import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, View } from 'react-native';
import {
  RichText,
  useEditorBridge,
  useEditorContent,
  type EditorBridge,
} from '@10play/tentap-editor';
import { AppText } from '../atoms/AppText';
import { Button } from '../atoms/Button';
import { TextField } from './Fields';

type SupportedEditor = EditorBridge & {
  toggleBold(): void;
  toggleItalic(): void;
  toggleHeading(level: 2 | 3): void;
  toggleBulletList(): void;
  toggleOrderedList(): void;
  setLink(value: string): void;
  undo(): void;
  redo(): void;
};

export interface RichTextEditorProps {
  label: string;
  value: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  linkLabel: string;
  linkPlaceholder: string;
  cancelLabel: string;
  confirmLabel: string;
  undoLabel: string;
  redoLabel: string;
  onChange(value: string): void;
  /** Web-only: images pasted in the editor are routed to the host importer. */
  onPasteImage?(image: Blob): void;
}

export function RichTextEditor({
  label,
  value,
  placeholder,
  error,
  disabled,
  linkLabel,
  linkPlaceholder,
  cancelLabel,
  confirmLabel,
  onChange,
}: RichTextEditorProps) {
  const editor = useEditorBridge({
    initialContent: value,
    avoidIosKeyboard: true,
    disableColorHighlight: true,
    editable: !disabled,
  }) as SupportedEditor;
  const content = useEditorContent(editor, {
    type: 'html',
    debounceInterval: 150,
  });
  const [linkOpen, setLinkOpen] = useState(false);
  const [link, setLink] = useState('');
  const actions = useMemo(
    () => [
      { label: 'H2', run: () => editor.toggleHeading(2) },
      { label: 'H3', run: () => editor.toggleHeading(3) },
      { label: 'B', run: () => editor.toggleBold() },
      { label: 'I', run: () => editor.toggleItalic() },
      { label: '•', run: () => editor.toggleBulletList() },
      { label: '1.', run: () => editor.toggleOrderedList() },
      { label: '↶', run: () => editor.undo() },
      { label: '↷', run: () => editor.redo() },
    ],
    [editor],
  );

  useEffect(() => {
    if (content !== undefined && content !== value) onChange(content);
  }, [content, onChange, value]);

  return (
    <View className="gap-1">
      <AppText variant="label" tone={error ? 'danger' : 'default'}>
        {label}
      </AppText>
      <View
        className={`border-border bg-surface dark:border-dark-border dark:bg-dark-surface overflow-hidden rounded-md border ${error ? 'border-danger dark:border-dark-danger' : ''}`}
      >
        <View className="border-border dark:border-dark-border flex-row flex-wrap gap-1 border-b p-2">
          {actions.map((action) => (
            <Button
              key={action.label}
              label={action.label}
              size="sm"
              variant="ghost"
              disabled={disabled}
              onPress={action.run}
            />
          ))}
          <Button
            label={linkLabel}
            size="sm"
            variant="ghost"
            disabled={disabled}
            onPress={() => setLinkOpen(true)}
          />
        </View>
        <RichText
          editor={editor}
          accessibilityLabel={label}
          style={{ minHeight: 220 }}
        />
      </View>
      {placeholder ? (
        <AppText variant="label" tone="muted">
          {placeholder}
        </AppText>
      ) : null}
      {error ? (
        <AppText accessibilityLiveRegion="polite" variant="label" tone="danger">
          {error}
        </AppText>
      ) : null}
      <Modal
        transparent
        animationType="fade"
        visible={linkOpen}
        onRequestClose={() => setLinkOpen(false)}
      >
        <Pressable
          className="bg-overlay flex-1 items-center justify-center px-6"
          onPress={() => setLinkOpen(false)}
        >
          <Pressable
            accessibilityViewIsModal
            className="bg-surface dark:bg-dark-surface w-full max-w-md gap-4 rounded-lg p-5"
            onPress={() => undefined}
          >
            <TextField
              label={linkLabel}
              placeholder={linkPlaceholder}
              keyboardType="url"
              autoCapitalize="none"
              value={link}
              onChangeText={setLink}
            />
            <View className="flex-row justify-end gap-2">
              <Button
                label={cancelLabel}
                variant="ghost"
                onPress={() => setLinkOpen(false)}
              />
              <Button
                label={confirmLabel}
                disabled={!/^https?:\/\//i.test(link)}
                onPress={() => {
                  editor.setLink(link);
                  setLink('');
                  setLinkOpen(false);
                }}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

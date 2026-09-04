import { createElement, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { AppText } from '../atoms/AppText';
import { Icon } from '../atoms/Icon';
import type { RichTextEditorProps } from './RichTextEditorImpl';

type Command = 'bold' | 'italic' | 'insertUnorderedList' | 'insertOrderedList';

const formatToolbar: readonly {
  label: string;
  icon?: never;
  command?: Command;
  block?: string;
}[] = [
  { label: 'P', block: 'p' },
  { label: 'H1', block: 'h1' },
  { label: 'H2', block: 'h2' },
  { label: 'H3', block: 'h3' },
  { label: 'B', command: 'bold' },
  { label: 'I', command: 'italic' },
  { label: '•', command: 'insertUnorderedList' },
  { label: '1.', command: 'insertOrderedList' },
];

const editorContentStyles = `
  .palea-rich-text-content h1 {
    font-size: 24px;
    font-weight: 700;
    line-height: 30px;
    margin: 16px 0 8px;
  }
  .palea-rich-text-content h2 {
    font-size: 20px;
    font-weight: 700;
    line-height: 26px;
    margin: 14px 0 8px;
  }
  .palea-rich-text-content h3 {
    font-size: 17px;
    font-weight: 700;
    line-height: 24px;
    margin: 12px 0 6px;
  }
  .palea-rich-text-content p {
    font-size: 14px;
    line-height: 20px;
    margin: 0 0 8px;
  }
  .palea-rich-text-content strong,
  .palea-rich-text-content b {
    font-weight: 700;
  }
  .palea-rich-text-content ul,
  .palea-rich-text-content ol {
    margin: 8px 0;
    padding-left: 24px;
  }
  .palea-rich-text-content ul { list-style-type: disc; }
  .palea-rich-text-content ol { list-style-type: decimal; }
  .palea-rich-text-content li { display: list-item; margin: 2px 0; }
`;

/**
 * TenTap currently renders through React Native WebView on Web. This adapter
 * preserves the same constrained HTML contract on the browser without loading
 * WebView; native platforms continue to use TenTap in RichTextEditorImpl.
 */
export function RichTextEditor({
  label,
  value,
  placeholder,
  error,
  disabled,
  undoLabel,
  redoLabel,
  onChange,
  onPasteImage,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLElement | null>(null);
  const lastEmittedValueRef = useRef(value);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!editorRef.current || value === lastEmittedValueRef.current) return;
    editorRef.current.innerHTML = value;
    lastEmittedValueRef.current = value;
  }, [value]);

  const sync = () => {
    const html = editorRef.current?.innerHTML ?? '';
    lastEmittedValueRef.current = html;
    onChange(html);
  };
  const apply = (item: (typeof formatToolbar)[number]) => {
    editorRef.current?.focus();
    if (item.block)
      document.execCommand('formatBlock', false, `<${item.block}>`);
    if (item.command) document.execCommand(item.command, false);
    sync();
  };
  const history = (command: 'undo' | 'redo') => {
    editorRef.current?.focus();
    document.execCommand(command, false);
    sync();
  };

  return (
    <View className="gap-1">
      {createElement('style', { type: 'text/css' }, editorContentStyles)}
      <AppText variant="label" tone={error ? 'danger' : 'default'}>
        {label}
      </AppText>
      <View
        className={`border-border bg-surface dark:border-dark-border dark:bg-dark-surface overflow-hidden rounded-md border ${focused ? 'border-focus-ring dark:border-dark-focus-ring' : ''} ${error ? 'border-danger dark:border-dark-danger' : ''}`}
      >
        <View className="border-border bg-surface-subtle dark:border-dark-border dark:bg-dark-surface-subtle flex-row items-center justify-between border-b px-2 py-2">
          <View className="border-border bg-surface dark:border-dark-border dark:bg-dark-surface flex-row items-center gap-1 rounded-md border p-1">
            {createElement(
              'button',
              {
                'aria-label': undoLabel,
                disabled,
                onMouseDown: (event: MouseEvent) => event.preventDefault(),
                onClick: () => history('undo'),
                style: kbdStyle,
              },
              [
                <Icon key="icon" name="undo" size="sm" tone="muted" />,
                undoLabel,
              ],
            )}
            {createElement(
              'button',
              {
                'aria-label': redoLabel,
                disabled,
                onMouseDown: (event: MouseEvent) => event.preventDefault(),
                onClick: () => history('redo'),
                style: kbdStyle,
              },
              [
                <Icon key="icon" name="redo" size="sm" tone="muted" />,
                redoLabel,
              ],
            )}
          </View>
          <View className="border-border bg-surface dark:border-dark-border dark:bg-dark-surface flex-row flex-wrap items-center gap-1 rounded-md border p-1">
            {formatToolbar.map((item) =>
              createElement(
                'button',
                {
                  key: item.label,
                  'aria-label': item.label,
                  disabled,
                  onMouseDown: (event: MouseEvent) => event.preventDefault(),
                  onClick: () => apply(item),
                  style: {
                    ...kbdStyle,
                    fontWeight: item.label === 'B' ? 800 : 600,
                    fontStyle: item.label === 'I' ? 'italic' : 'normal',
                  },
                },
                item.label,
              ),
            )}
          </View>
        </View>
        {createElement('div', {
          'aria-label': label,
          'aria-multiline': true,
          'aria-placeholder': placeholder,
          contentEditable: !disabled,
          className: 'palea-rich-text-content',
          onBlur: () => setFocused(false),
          onFocus: () => setFocused(true),
          onInput: (event: { currentTarget: HTMLElement }) => {
            const html = event.currentTarget.innerHTML;
            lastEmittedValueRef.current = html;
            onChange(html);
          },
          onPaste: (event: ClipboardEvent) => {
            const image = Array.from(event.clipboardData?.items ?? [])
              .find((item) => item.type.startsWith('image/'))
              ?.getAsFile();
            if (!image) return;
            event.preventDefault();
            onPasteImage?.(image);
          },
          role: 'textbox',
          suppressContentEditableWarning: true,
          ref: (node: HTMLElement | null) => {
            editorRef.current = node;
          },
          style: {
            minHeight: 220,
            outline: 'none',
            fontSize: 14,
            lineHeight: '20px',
            padding: 16,
            whiteSpace: 'pre-wrap',
          },
        })}
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
    </View>
  );
}

const kbdStyle = {
  background: 'transparent',
  border: '1px solid transparent',
  borderRadius: 4,
  color: 'inherit',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  fontSize: 11,
  lineHeight: '20px',
  minWidth: 48,
  minHeight: 48,
  justifyContent: 'center',
  padding: '0 6px',
} as const;

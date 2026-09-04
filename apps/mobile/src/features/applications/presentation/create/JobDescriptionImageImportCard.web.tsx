import { createElement, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { AppText, Icon } from '@palea/ui-native';

interface JobDescriptionImageImportCardProps {
  title: string;
  description: string;
  disabled?: boolean;
  onSelectImage(uri: string, release: () => void): void;
}

function isImage(file: File | undefined): file is File {
  return Boolean(file?.type.startsWith('image/'));
}

/** Browser upload boundary: only image files become short-lived object URLs. */
export function JobDescriptionImageImportCard({
  title,
  description,
  disabled,
  onSelectImage,
}: JobDescriptionImageImportCardProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const select = (file: File | undefined) => {
    if (!isImage(file) || disabled) return;
    const uri = URL.createObjectURL(file);
    onSelectImage(uri, () => URL.revokeObjectURL(uri));
  };

  useEffect(() => {
    const preventNavigation = (event: DragEvent) => event.preventDefault();
    const dropImage = (event: DragEvent) => {
      event.preventDefault();
      setDragging(false);
      select(event.dataTransfer?.files[0]);
    };
    document.addEventListener('dragover', preventNavigation);
    document.addEventListener('drop', dropImage);
    return () => {
      document.removeEventListener('dragover', preventNavigation);
      document.removeEventListener('drop', dropImage);
    };
  }, [disabled]);

  return createElement(
    'div',
    {
      'aria-disabled': disabled,
      'aria-label': `${title}. ${description}`,
      onClick: () => {
        if (!disabled) inputRef.current?.click();
      },
      onDragEnter: (event: DragEvent) => {
        event.preventDefault();
        setDragging(true);
      },
      onDragOver: (event: DragEvent) => event.preventDefault(),
      onDragLeave: () => setDragging(false),
      onDrop: (event: DragEvent) => {
        event.preventDefault();
        setDragging(false);
        select(event.dataTransfer?.files[0]);
      },
      onKeyDown: (event: KeyboardEvent) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          if (!disabled) inputRef.current?.click();
        }
      },
      role: 'button',
      style: {
        alignItems: 'center',
        background: dragging ? '#e0f2fe' : '#f8fafc',
        border: `2px dashed ${dragging ? '#0284c7' : '#cbd5e1'}`,
        borderRadius: 8,
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex',
        justifyContent: 'center',
        minHeight: 144,
        opacity: disabled ? 0.6 : 1,
        padding: 24,
      },
      tabIndex: disabled ? -1 : 0,
    },
    createElement('input', {
      accept: 'image/*',
      'aria-hidden': true,
      onClick: (event: MouseEvent) => event.stopPropagation(),
      onChange: (event: Event) => {
        const input = event.currentTarget as HTMLInputElement;
        select(input.files?.[0]);
        input.value = '';
      },
      ref: (node: HTMLInputElement | null) => {
        inputRef.current = node;
      },
      style: { display: 'none' },
      type: 'file',
    }),
    <View className="items-center gap-2">
      <Icon name="upload" size="lg" tone="muted" />
      <AppText variant="label">{title}</AppText>
      <AppText variant="caption" tone="muted">
        {description}
      </AppText>
    </View>,
  );
}

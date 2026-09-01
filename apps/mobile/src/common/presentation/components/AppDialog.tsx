import { useEffect, type PropsWithChildren } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  View,
  useWindowDimensions,
} from 'react-native';
import { Surface } from '@palea/ui-native';

export function AppDialog({
  children,
  title,
  onDismiss,
  anchor,
  sheet = false,
  busy = false,
  returnFocusId,
}: PropsWithChildren<{
  title: string;
  onDismiss: () => void;
  anchor?: { x: number; y: number };
  sheet?: boolean;
  busy?: boolean;
  returnFocusId?: string;
}>) {
  const { width, height } = useWindowDimensions();
  const compact = width < 768;
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const trigger = document.activeElement;
    return () => {
      if (trigger instanceof HTMLElement && trigger.isConnected)
        trigger.focus();
      else if (returnFocusId) document.getElementById(returnFocusId)?.focus();
    };
  }, [returnFocusId]);
  return (
    <Modal
      transparent
      visible
      animationType="none"
      accessibilityViewIsModal
      accessibilityLabel={title}
      onRequestClose={() => {
        if (!busy) onDismiss();
      }}
    >
      <View
        className={`flex-1 bg-black/30 p-4 ${sheet && compact ? 'justify-end' : 'items-center justify-center'}`}
      >
        <Pressable
          accessible={false}
          tabIndex={-1}
          className="absolute inset-0"
          onPress={() => {
            if (!busy) onDismiss();
          }}
        />
        <Surface
          variant="elevated"
          padding="none"
          className="w-full overflow-hidden"
          style={
            anchor && !compact
              ? {
                  position: 'absolute',
                  width: 256,
                  left: Math.min(Math.max(16, anchor.x - 240), width - 272),
                  top: Math.max(16, Math.min(anchor.y + 8, height - 330)),
                }
              : { maxWidth: 440 }
          }
        >
          {children}
        </Surface>
      </View>
    </Modal>
  );
}

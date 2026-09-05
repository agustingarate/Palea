import { Modal, Pressable, View } from 'react-native';
import { AppText, Icon, Surface } from '@palea/ui-native';

export function ApplicationActionMenu({
  anchor,
  labels,
  onDismiss,
  onEdit,
  onDelete,
}: {
  anchor: { x: number; y: number };
  labels: { edit: string; remove: string; cancel: string };
  onDismiss: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Modal
      transparent
      animationType="fade"
      visible
      accessibilityViewIsModal
      onRequestClose={onDismiss}
    >
      <Pressable
        className="flex-1 bg-black/10"
        accessibilityRole="button"
        accessibilityLabel={labels.cancel}
        onPress={onDismiss}
      >
        <Pressable
          accessibilityRole="menu"
          className="absolute w-44"
          style={{ left: Math.max(12, anchor.x - 176), top: anchor.y + 2 }}
          onPress={(event) => event.stopPropagation()}
        >
          <Surface
            variant="elevated"
            padding="none"
            className="overflow-hidden"
          >
            <Pressable
              accessibilityRole="menuitem"
              className="min-h-control-sm flex-row items-center gap-2 px-3"
              onPress={onEdit}
            >
              <Icon name="edit" size="sm" tone="muted" />
              <AppText variant="label" className="flex-1">
                {labels.edit}
              </AppText>
            </Pressable>
            <View className="border-t border-border dark:border-dark-border" />
            <Pressable
              accessibilityRole="menuitem"
              className="min-h-control-sm flex-row items-center gap-2 px-3"
              onPress={onDelete}
            >
              <Icon name="trash" size="sm" tone="danger" />
              <AppText variant="label" className="flex-1" tone="danger">
                {labels.remove}
              </AppText>
            </Pressable>
          </Surface>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

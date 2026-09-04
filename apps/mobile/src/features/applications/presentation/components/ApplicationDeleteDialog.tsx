import { Modal, Pressable, View } from 'react-native';
import { AppText, Button } from '@palea/ui-native';
import type { Application } from '../../domain/entities/Application';

export function ApplicationDeleteDialog({
  visible,
  application,
  pending,
  labels,
  onDismiss,
  onConfirm,
}: {
  visible: boolean;
  application: Application | null;
  pending: boolean;
  labels: {
    title: string;
    message: string;
    cancel: string;
    confirm: string;
    pending: string;
  };
  onDismiss: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={pending ? undefined : onDismiss}
    >
      <Pressable
        className="flex-1 items-center justify-center bg-overlay px-6"
        disabled={pending}
        onPress={onDismiss}
      >
        <Pressable
          accessibilityViewIsModal
          accessibilityRole="alert"
          className="w-full max-w-md gap-5 rounded-lg bg-surface p-6 dark:bg-dark-surface"
          onPress={(event) => event.stopPropagation()}
        >
          <View className="gap-2">
            <AppText accessibilityRole="header" variant="sectionTitle">
              {labels.title}
            </AppText>
            {application ? (
              <AppText variant="bodySmall" className="font-semibold">
                {application.role} · {application.companyName}
              </AppText>
            ) : null}
            <AppText accessibilityLiveRegion="polite" tone="muted">
              {pending ? labels.pending : labels.message}
            </AppText>
          </View>
          <View className="flex-row justify-end gap-3">
            <Button
              label={labels.cancel}
              variant="secondary"
              disabled={pending}
              onPress={onDismiss}
            />
            <Button
              label={labels.confirm}
              variant="destructive"
              loading={pending}
              disabled={pending}
              onPress={onConfirm}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

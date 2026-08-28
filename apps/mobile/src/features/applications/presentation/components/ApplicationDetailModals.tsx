import { Modal, Pressable, View } from 'react-native';
import type { ReactNode } from 'react';
import { AppText, Button, DatePickerField } from '@palea/ui-native';
import type { Resume } from '@palea/contracts';
import type { ApplicationStatus } from '../../domain/entities/Application';

type DateLabels = {
  title: string;
  message: string;
  date: string;
  placeholder: string;
  clear: string;
  cancel: string;
  confirm: string;
  move: string;
};

export function ApplicationDetailModals({
  status,
  resume,
  date,
}: {
  status: {
    visible: boolean;
    current: ApplicationStatus;
    labels: { status: ApplicationStatus; label: string }[];
    onClose: () => void;
    onSelect: (value: ApplicationStatus) => void;
  };
  resume: {
    visible: boolean;
    resumes: Resume[];
    selected: string | null;
    busy: boolean;
    labels: { title: string; none: string; upload: string; cancel: string };
    onClose: () => void;
    onSelect: (value: string | null) => void;
    onUpload: () => Promise<void>;
  };
  date: {
    visible: boolean;
    value: string | null;
    labels: DateLabels;
    onClose: () => void;
    onChange: (value: string | null) => void;
    onConfirm: () => void;
  };
}) {
  return (
    <>
      <Overlay visible={status.visible} onClose={status.onClose}>
        {status.labels.map(({ status: value, label }) => (
          <Button
            key={value}
            label={label}
            variant={value === status.current ? 'primary' : 'secondary'}
            onPress={() => status.onSelect(value)}
          />
        ))}
      </Overlay>
      <Overlay visible={resume.visible} onClose={resume.onClose}>
        <AppText variant="sectionTitle">{resume.labels.title}</AppText>
        <Button
          label={resume.labels.none}
          variant={resume.selected === null ? 'primary' : 'secondary'}
          disabled={resume.busy}
          onPress={() => resume.onSelect(null)}
        />
        {resume.resumes.map((item) => (
          <Button
            key={item.id}
            label={item.displayName}
            variant={item.id === resume.selected ? 'primary' : 'secondary'}
            disabled={resume.busy}
            onPress={() => resume.onSelect(item.id)}
          />
        ))}
        <Button
          label={resume.labels.upload}
          variant="secondary"
          loading={resume.busy}
          onPress={() => void resume.onUpload()}
        />
        <Button
          label={resume.labels.cancel}
          variant="ghost"
          onPress={resume.onClose}
        />
      </Overlay>
      <Overlay visible={date.visible} onClose={date.onClose}>
        <View className="gap-1">
          <AppText variant="sectionTitle">{date.labels.title}</AppText>
          <AppText tone="muted">{date.labels.message}</AppText>
        </View>
        <DatePickerField
          label={date.labels.date}
          value={date.value}
          maximum={new Date().toISOString().slice(0, 10)}
          placeholder={date.labels.placeholder}
          clearLabel={date.labels.clear}
          cancelLabel={date.labels.cancel}
          confirmLabel={date.labels.confirm}
          onChange={date.onChange}
        />
        <View className="flex-row justify-end gap-2">
          <Button
            label={date.labels.cancel}
            variant="ghost"
            onPress={date.onClose}
          />
          <Button
            label={date.labels.move}
            disabled={!date.value}
            onPress={date.onConfirm}
          />
        </View>
      </Overlay>
    </>
  );
}
function Overlay({
  visible,
  onClose,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1 items-center justify-center bg-black/20 px-6"
        onPress={onClose}
      >
        <Pressable
          accessibilityViewIsModal
          className="w-full max-w-md gap-3 rounded-md bg-white p-5"
          onPress={(event) => event.stopPropagation()}
        >
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

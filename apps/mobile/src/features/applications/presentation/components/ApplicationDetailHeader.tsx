import { View } from 'react-native';
import {
  AppText,
  Badge,
  Button,
  Icon,
  IconButton,
  TopAppBar,
} from '@palea/ui-native';
import type {
  ApplicationDetail,
  ApplicationStatus,
} from '../../domain/entities/Application';

export function ApplicationDetailHeader({
  application,
  expanded,
  backLabel,
  statusLabel,
  changeStatusLabel,
  deleteLabel,
  onBack,
  onStatus,
  onDelete,
  deleting,
}: {
  application: ApplicationDetail;
  expanded: boolean;
  backLabel: string;
  statusLabel: string;
  changeStatusLabel: string;
  deleteLabel: string;
  onBack: () => void;
  onStatus: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  if (!expanded)
    return (
      <TopAppBar
        title={application.role}
        subtitle={application.companyName}
        leading={
          <Button
            label=""
            leadingIcon="arrowBack"
            accessibilityLabel={backLabel}
            variant="ghost"
            onPress={onBack}
          />
        }
        trailing={
          <View className="flex-row items-center gap-1">
            <Button
              label={statusLabel}
              trailingIcon="chevronDown"
              accessibilityLabel={changeStatusLabel}
              variant="ghost"
              size="sm"
              onPress={onStatus}
            />
            <IconButton
              icon="trash"
              accessibilityLabel={deleteLabel}
              disabled={deleting}
              onPress={onDelete}
            />
          </View>
        }
        trailingClassName="items-end"
      />
    );
  return (
    <View className="border-b border-border bg-surface dark:border-dark-border dark:bg-dark-surface">
      <View
        className="min-h-24 w-full flex-row items-center gap-5 py-4"
        style={{ alignSelf: 'center', maxWidth: 1200, paddingHorizontal: 32 }}
      >
        <Button
          label={backLabel}
          leadingIcon="arrowBack"
          accessibilityLabel={backLabel}
          variant="ghost"
          onPress={onBack}
        />
        <View className="min-w-0 flex-1 gap-1">
          <AppText
            accessibilityRole="header"
            variant="screenTitle"
            numberOfLines={1}
          >
            {application.role}
          </AppText>
          <View className="flex-row flex-wrap items-center gap-2">
            <AppText variant="bodySmall" className="font-semibold">
              {application.companyName}
            </AppText>
            {application.location ? (
              <>
                <AppText variant="label" tone="muted">
                  •
                </AppText>
                <View className="flex-row items-center gap-1">
                  <Icon name="location" size="sm" tone="muted" />
                  <AppText variant="bodySmall" tone="muted">
                    {application.location}
                  </AppText>
                </View>
              </>
            ) : null}
            <Badge label={statusLabel} tone={statusTone(application.status)} />
          </View>
        </View>
        <View className="flex-row items-center gap-2">
          <Button
            label={deleteLabel}
            leadingIcon="trash"
            loading={deleting}
            variant="destructive"
            onPress={onDelete}
          />
          <Button
            label={changeStatusLabel}
            trailingIcon="arrowForward"
            onPress={onStatus}
          />
        </View>
      </View>
    </View>
  );
}

function statusTone(status: ApplicationStatus) {
  if (status === 'applied') return 'info' as const;
  if (status === 'interview') return 'warning' as const;
  if (status === 'offer') return 'success' as const;
  if (status === 'rejected') return 'danger' as const;
  return 'neutral' as const;
}

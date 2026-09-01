import { useState } from 'react';
import { Pressable, View } from 'react-native';
import {
  createAnimatedComponent,
  interpolateColor,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { primitives, themes } from '@palea/design-tokens';
import { useColorScheme } from 'nativewind';
import type { Resume } from '@palea/contracts';
import {
  AppText,
  Badge,
  Button,
  FeedbackMessage,
  Icon,
  IconButton,
  Skeleton,
  Surface,
} from '@palea/ui-native';
import { useLocale } from '@/core/localization/LocaleProvider';

const AnimatedView = createAnimatedComponent(View);

export type ResumeCollectionView = 'grid' | 'list';
export function ResumeLibraryCollection({
  items,
  selectedId,
  view,
  loading,
  error,
  onRetry,
  onOpen,
  onActions,
  onDownload,
  onUpload,
  uploadDisabled,
  supportLabel,
  busyId,
}: {
  items: Resume[];
  selectedId: string | null;
  view: ResumeCollectionView;
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  onOpen: (resume: Resume) => void;
  onActions: (resume: Resume, anchor: { x: number; y: number }) => void;
  onDownload: (resume: Resume) => void;
  onUpload: () => void;
  uploadDisabled: boolean;
  supportLabel: string;
  busyId?: string;
}) {
  const { t, i18n } = useLocale('resumes');
  const [width, setWidth] = useState(0);
  const columns = Math.max(
    1,
    Math.floor((width + 16) / (width < 600 ? 184 : 226)),
  );
  const cardWidth = width ? (width - (columns - 1) * 16) / columns : 210;
  if (error)
    return (
      <FeedbackMessage
        title={t('errorTitle')}
        message={t('errorMessage')}
        tone="danger"
        actionLabel={t('retry')}
        onAction={onRetry}
      />
    );
  if (!loading && !items.length)
    return (
      <View className="min-h-80 items-center justify-center gap-4 rounded-md border border-dashed border-border bg-surface px-6 py-12 dark:border-dark-border dark:bg-dark-surface">
        <View className="h-16 w-16 items-center justify-center rounded-full bg-interaction-subtle dark:bg-dark-interaction-subtle">
          <Icon name="filePlusCorner" size={30} tone="interaction" />
        </View>
        <View className="max-w-sm gap-2">
          <AppText
            accessibilityRole="header"
            variant="sectionTitle"
            className="text-center"
          >
            {t('emptyTitle')}
          </AppText>
          <AppText variant="bodySmall" tone="muted" className="text-center">
            {t('emptyMessage')}
          </AppText>
        </View>
        <Button
          label={t('emptyAction')}
          nativeID="resume-library-upload"
          leadingIcon="upload"
          disabled={uploadDisabled}
          onPress={onUpload}
        />
        <AppText variant="caption" tone="muted">
          {supportLabel}
        </AppText>
      </View>
    );
  return (
    <View
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      className={view === 'grid' ? 'flex-row flex-wrap gap-4' : 'gap-3'}
    >
      {loading
        ? Array.from({ length: 4 }, (_, index) => (
            <Surface
              key={index}
              style={view === 'grid' ? { width: cardWidth } : { width: '100%' }}
              className={
                view === 'grid'
                  ? 'h-52 gap-4'
                  : 'h-24 flex-row items-center gap-3'
              }
            >
              <Skeleton className="h-10 w-10" />
              <View className="flex-1 gap-2">
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-3 w-3/5" />
              </View>
            </Surface>
          ))
        : items.map((resume) => (
            <ResumeItem
              key={resume.id}
              resume={resume}
              selected={selectedId === resume.id}
              grid={view === 'grid'}
              width={cardWidth}
              locale={i18n.language}
              busy={busyId === resume.id}
              onOpen={() => onOpen(resume)}
              onDownload={() => onDownload(resume)}
              onActions={(anchor) => onActions(resume, anchor)}
            />
          ))}
      {!loading ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('uploadNew')}
          disabled={uploadDisabled}
          onPress={onUpload}
          className={`items-center justify-center gap-2 rounded-md border border-dashed border-border px-4 py-6 hover:bg-surface-subtle dark:border-dark-border dark:hover:bg-dark-surface-subtle ${uploadDisabled ? 'opacity-50' : ''}`}
          style={
            view === 'grid'
              ? { width: cardWidth, minHeight: 220 }
              : { width: '100%', minHeight: 128 }
          }
        >
          <View className="h-10 w-10 items-center justify-center rounded-full bg-surface-subtle dark:bg-dark-surface-subtle">
            <Icon name="upload" size="md" tone="muted" />
          </View>
          <AppText variant="label">{t('uploadNew')}</AppText>
          <AppText variant="caption" tone="muted" className="text-center">
            {supportLabel}
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

function ResumeItem({
  resume,
  selected,
  grid,
  width,
  locale,
  busy,
  onOpen,
  onDownload,
  onActions,
}: {
  resume: Resume;
  selected: boolean;
  grid: boolean;
  width: number;
  locale: string;
  busy: boolean;
  onOpen: () => void;
  onDownload: () => void;
  onActions: (anchor: { x: number; y: number }) => void;
}) {
  const { t } = useLocale('resumes');
  const { colorScheme } = useColorScheme();
  const theme = themes[colorScheme === 'dark' ? 'dark' : 'light'];
  const [focused, setFocused] = useState(false);
  const hoverProgress = useSharedValue(0);
  const liftStyle = useAnimatedStyle(
    () => ({
      backgroundColor: selected
        ? theme.interactionSubtle
        : interpolateColor(
            hoverProgress.value,
            [0, 1],
            [theme.surface, theme.surfaceSubtle],
          ),
      transform: [{ translateY: hoverProgress.value * -2 }],
    }),
    [
      hoverProgress,
      selected,
      theme.interactionSubtle,
      theme.surface,
      theme.surfaceSubtle,
    ],
  );
  const setHovered = (hovered: boolean) => {
    hoverProgress.value = withTiming(hovered && !selected ? 0.5 : 0, {
      duration: primitives.motion.duration.standard,
      reduceMotion: ReduceMotion.System,
    });
  };
  const date = resume.uploadedAt
    ? new Intl.DateTimeFormat(locale, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(new Date(resume.uploadedAt))
    : t('noDate');
  const size =
    new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(
      resume.sizeBytes / (resume.sizeBytes >= 1048576 ? 1048576 : 1024),
    ) + (resume.sizeBytes >= 1048576 ? ' MiB' : ' KiB');
  const menu = (
    <IconButton
      icon="more"
      iconSize="md"
      accessibilityLabel={t('actions', { name: resume.displayName })}
      disabled={busy}
      onPress={(event) =>
        onActions({ x: event.nativeEvent.pageX, y: event.nativeEvent.pageY })
      }
    />
  );
  return (
    <AnimatedView
      style={[
        {
          borderRadius: primitives.radius.md,
          overflow: 'hidden',
          width: grid ? width : '100%',
        },
        liftStyle,
      ]}
    >
      <Surface
        padding="none"
        variant={selected ? 'selected' : 'default'}
        style={[
          grid ? { minHeight: 220 } : undefined,
          { backgroundColor: 'transparent' },
        ]}
        className={`overflow-hidden ${focused ? 'border-focus-ring dark:border-dark-focus-ring' : ''}`}
      >
        <View className={grid ? 'flex-1' : 'flex-row items-center px-1'}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('open', { name: resume.displayName })}
            accessibilityState={{ selected, busy }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onHoverIn={() => setHovered(true)}
            onHoverOut={() => setHovered(false)}
            onPress={onOpen}
            className={
              grid
                ? 'flex-1 gap-4 p-4'
                : 'min-w-0 flex-1 flex-row items-center gap-3 p-3'
            }
          >
            <View
              className={
                grid ? 'flex-row items-center justify-between gap-2' : ''
              }
            >
              <View className="h-10 w-10 items-center justify-center rounded-sm bg-surface-subtle dark:bg-dark-surface-subtle">
                <Icon
                  name="fileText"
                  size="lg"
                  tone={selected ? 'interaction' : 'muted'}
                />
              </View>
              {grid && resume.isPrimary ? (
                <Badge label={t('primary')} tone="interaction" />
              ) : null}
            </View>
            <View className={grid ? 'gap-2' : 'min-w-0 flex-1 gap-1'}>
              <AppText
                variant="bodySmall"
                className="font-medium"
                numberOfLines={2}
              >
                {resume.displayName}
              </AppText>
              {grid ? (
                <View className="gap-1">
                  <View className="flex-row justify-between gap-1">
                    <AppText variant="caption" tone="muted">
                      {t('dateLabel')}
                    </AppText>
                    <AppText variant="caption" tone="muted">
                      {date}
                    </AppText>
                  </View>
                  <View className="flex-row justify-between">
                    <AppText variant="caption" tone="muted">
                      {t('fileSize')}
                    </AppText>
                    <AppText variant="caption" tone="muted">
                      {size}
                    </AppText>
                  </View>
                </View>
              ) : (
                <View className="flex-row flex-wrap items-center gap-2">
                  {resume.isPrimary ? (
                    <Badge label={t('primary')} tone="interaction" />
                  ) : null}
                  <AppText variant="caption" tone="muted">
                    {date} · {size}
                  </AppText>
                </View>
              )}
            </View>
          </Pressable>
          {!grid ? menu : null}
        </View>
        {grid ? (
          <View className="flex-row items-center justify-between border-t border-border px-2 dark:border-dark-border">
            <IconButton
              icon="eye"
              iconSize="sm"
              accessibilityLabel={t('open', { name: resume.displayName })}
              onPress={onOpen}
            />
            <IconButton
              icon="download"
              iconSize="sm"
              accessibilityLabel={t('download')}
              disabled={busy}
              onPress={onDownload}
            />
            {menu}
          </View>
        ) : null}
      </Surface>
    </AnimatedView>
  );
}

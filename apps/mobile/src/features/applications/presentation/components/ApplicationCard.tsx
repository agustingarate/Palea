import { PanResponder, Platform, Pressable, View } from 'react-native';
import { useEffect, useMemo, useRef } from 'react';
import {
  createAnimatedComponent,
  FadeIn,
  LinearTransition,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { primitives } from '@palea/design-tokens';
import { AppText, Chip, Icon, IconButton, Surface } from '@palea/ui-native';
import type { Application } from '../../domain/entities/Application';

const AnimatedView = createAnimatedComponent(View);
const metadataTypography = primitives.typography.micro;

function formatAppliedOn(appliedOn: string | null, locale: string) {
  if (!appliedOn) return null;
  const date = new Date(`${appliedOn}T12:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
  }).format(date);
}

export interface ApplicationCardProps {
  application: Application;
  onAction: (
    application: Application,
    anchor: { x: number; y: number },
  ) => void;
  onDrag?: (application: Application | null) => void;
  onDrop?: (application: Application, point: { x: number; y: number }) => void;
  onDragMove?: (point: { x: number; y: number }) => void;
  onMeasure?: (y: number, height: number) => void;
  selected?: boolean;
  dragInitiation?: 'immediate' | 'threshold';
  /** Scroll offset of the containing list while this card is being dragged. */
  scrollOffset?: number;
  workModeLabel: string;
  actionsLabel: string;
  dateLocale: string;
}

export function ApplicationCard({
  application,
  onAction,
  onDrag,
  onDrop,
  onDragMove,
  onMeasure,
  selected = false,
  dragInitiation = 'threshold',
  scrollOffset = 0,
  workModeLabel,
  actionsLabel,
  dateLocale,
}: ApplicationCardProps) {
  const formattedAppliedOn = formatAppliedOn(application.appliedOn, dateLocale);
  const cardRef = useRef<View>(null);
  const actionRef = useRef<View>(null);
  const armed = useRef(false);
  const callbacks = useRef({ application, onDrag, onDrop, onDragMove });
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const scrollCompensation = useSharedValue(0);
  const dragScrollStart = useRef(0);
  const currentScrollOffset = useRef(scrollOffset);
  const isDragging = useRef(false);
  useEffect(() => {
    callbacks.current = { application, onDrag, onDrop, onDragMove };
  }, [application, onDrag, onDrop, onDragMove]);
  useEffect(() => {
    currentScrollOffset.current = scrollOffset;
    if (isDragging.current) {
      scrollCompensation.value = scrollOffset - dragScrollStart.current;
    }
  }, [scrollCompensation, scrollOffset]);
  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.value },
      { translateY: y.value + scrollCompensation.value },
      { scale: x.value || y.value ? 1.015 : 1 },
    ],
    zIndex: x.value || y.value ? 100 : 0,
    elevation: x.value || y.value ? 12 : 0,
  }));
  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () =>
          Platform.OS === 'web' &&
          dragInitiation === 'immediate' &&
          Boolean(callbacks.current.onDrop),
        onMoveShouldSetPanResponder: (_, g) =>
          Boolean(callbacks.current.onDrop) &&
          (armed.current ||
            (Platform.OS === 'web' &&
              (Math.abs(g.dx) > 4 || Math.abs(g.dy) > 4))),
        onMoveShouldSetPanResponderCapture: (_, g) =>
          Boolean(callbacks.current.onDrop) &&
          (armed.current ||
            (Platform.OS === 'web' &&
              (Math.abs(g.dx) > 4 || Math.abs(g.dy) > 4))),
        onPanResponderTerminationRequest: () => false,
        onShouldBlockNativeResponder: () => true,
        onPanResponderGrant: () => {
          armed.current = false;
          isDragging.current = true;
          dragScrollStart.current = currentScrollOffset.current;
          scrollCompensation.value = 0;
          callbacks.current.onDrag?.(callbacks.current.application);
        },
        onPanResponderMove: (_, g) => {
          x.value = g.dx;
          y.value = g.dy;
          callbacks.current.onDragMove?.({ x: g.moveX, y: g.moveY });
        },
        onPanResponderRelease: (_, g) => {
          const transition = {
            duration: primitives.motion.duration.standard,
            reduceMotion: ReduceMotion.System,
          };
          x.value = withTiming(0, transition);
          y.value = withTiming(0, transition);
          scrollCompensation.value = 0;
          isDragging.current = false;
          callbacks.current.onDrop?.(callbacks.current.application, {
            x: g.moveX,
            y: g.moveY,
          });
          armed.current = false;
        },
        onPanResponderTerminate: () => {
          const transition = {
            duration: primitives.motion.duration.standard,
            reduceMotion: ReduceMotion.System,
          };
          x.value = withTiming(0, transition);
          y.value = withTiming(0, transition);
          scrollCompensation.value = 0;
          isDragging.current = false;
          armed.current = false;
          callbacks.current.onDrag?.(null);
        },
      }),
    [dragInitiation, scrollCompensation, x, y],
  );
  // TODO(CU-86ajvbvd3): make the card open the application detail route.
  return (
    <AnimatedView
      {...(onDrop ? responder.panHandlers : {})}
      ref={cardRef}
      style={style}
      onLayout={() =>
        cardRef.current?.measureInWindow((_x, top, _width, height) =>
          onMeasure?.(top, height),
        )
      }
      entering={FadeIn.duration(
        primitives.motion.duration.standard,
      ).reduceMotion(ReduceMotion.System)}
      layout={LinearTransition.duration(
        primitives.motion.duration.standard,
      ).reduceMotion(ReduceMotion.System)}
    >
      <Surface
        className={`gap-3 p-3 ${selected ? 'border-interaction bg-interaction-subtle dark:border-dark-interaction dark:bg-dark-interaction-subtle' : ''}`}
        padding="none"
        style={{ overflow: 'visible' }}
      >
        <View className="flex-row items-start gap-2">
          <View className="h-8 w-8 items-center justify-center rounded-sm bg-surface-subtle dark:bg-dark-surface-subtle">
            <Icon name="briefcase" size="sm" tone="muted" />
          </View>
          <Pressable
            className="flex-1 gap-1"
            accessibilityRole="button"
            onLongPress={() => {
              armed.current = true;
              onDrag?.(application);
            }}
            onPressOut={() => {
              if (armed.current) {
                armed.current = false;
                onDrag?.(null);
              }
            }}
            delayLongPress={250}
          >
            <AppText
              variant="bodySmall"
              className="font-bold"
              numberOfLines={2}
            >
              {application.role}
            </AppText>
            <AppText
              variant="label"
              tone="muted"
              className="font-normal opacity-80"
              numberOfLines={1}
            >
              {application.companyName}
            </AppText>
          </Pressable>
          <View ref={actionRef}>
            <IconButton
              icon="more"
              iconSize="sm"
              accessibilityLabel={actionsLabel}
              style={{ marginRight: -12, marginTop: -12 }}
              onPress={() =>
                actionRef.current?.measureInWindow((left, top, width, height) =>
                  onAction(application, { x: left + width, y: top + height }),
                )
              }
            />
          </View>
        </View>
        <View className="flex-row flex-wrap items-center gap-2">
          {formattedAppliedOn ? (
            <View className="flex-row items-center gap-1">
              <Icon
                name="calendar"
                size={metadataTypography.fontSize}
                tone="muted"
              />
              <AppText
                variant="micro"
                tone="muted"
                style={{
                  fontSize: metadataTypography.fontSize,
                  lineHeight: metadataTypography.lineHeight,
                  letterSpacing: metadataTypography.letterSpacing,
                }}
              >
                {formattedAppliedOn}
              </AppText>
            </View>
          ) : null}
          <View className="ml-auto">
            <Chip label={workModeLabel} size="sm" />
          </View>
        </View>
      </Surface>
    </AnimatedView>
  );
}

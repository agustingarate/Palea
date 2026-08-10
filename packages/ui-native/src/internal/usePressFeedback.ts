import {
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { primitives } from '@palea/design-tokens';

export function usePressFeedback(kind: 'control' | 'icon' = 'control') {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(
    () => ({ transform: [{ scale: scale.value }] }),
    [scale],
  );
  const target = primitives.motion.pressScale[kind];

  return {
    animatedStyle,
    onPressIn: () => {
      scale.value = withTiming(target, {
        duration: primitives.motion.duration.fast,
        reduceMotion: ReduceMotion.System,
      });
    },
    onPressOut: () => {
      scale.value = withTiming(1, {
        duration: primitives.motion.duration.fast,
        reduceMotion: ReduceMotion.System,
      });
    },
  };
}

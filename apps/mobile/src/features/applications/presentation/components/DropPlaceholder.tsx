import { View } from 'react-native';
import {
  createAnimatedComponent,
  FadeIn,
  LinearTransition,
  ReduceMotion,
} from 'react-native-reanimated';
import { primitives } from '@palea/design-tokens';

const AnimatedView = createAnimatedComponent(View);

export function DropPlaceholder() {
  return (
    <AnimatedView
      entering={FadeIn.duration(primitives.motion.duration.fast).reduceMotion(
        ReduceMotion.System,
      )}
      layout={LinearTransition.duration(
        primitives.motion.duration.standard,
      ).reduceMotion(ReduceMotion.System)}
      className="h-20 rounded-sm border-2 border-dashed border-interaction bg-interaction-subtle dark:border-dark-interaction dark:bg-dark-interaction-subtle"
    />
  );
}

const ReactNative = require('react-native');

function animationBuilder() {
  const builder = {
    duration: () => builder,
    reduceMotion: () => builder,
  };
  return builder;
}

module.exports = {
  __esModule: true,
  default: {
    View: ReactNative.View,
    Text: ReactNative.Text,
    Image: ReactNative.Image,
    ScrollView: ReactNative.ScrollView,
    FlatList: ReactNative.FlatList,
  },
  ReduceMotion: { System: 'system', Always: 'always', Never: 'never' },
  FadeIn: animationBuilder(),
  FadeInDown: animationBuilder(),
  FadeOut: animationBuilder(),
  FadeOutUp: animationBuilder(),
  ZoomIn: animationBuilder(),
  ZoomOut: animationBuilder(),
  LinearTransition: animationBuilder(),
  cancelAnimation: () => undefined,
  createAnimatedComponent: (component) => component,
  interpolateColor: (_value, _inputRange, outputRange) => outputRange[0],
  useAnimatedStyle: (factory) => factory(),
  useSharedValue: (value) => ({ value }),
  withRepeat: (value) => value,
  withTiming: (value) => value,
};

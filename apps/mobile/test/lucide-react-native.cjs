const React = require('react');
const { View } = require('react-native');

module.exports = new Proxy(
  {},
  {
    get(_target, property) {
      if (property === '__esModule') return true;
      return function MockLucideIcon(props) {
        return React.createElement(View, {
          accessibilityLabel: props.accessibilityLabel,
          testID: `icon-${String(property)}`,
        });
      };
    },
  },
);

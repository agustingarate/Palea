const {
  primitives,
  themes,
  toNativeWindTheme,
} = require('@palea/design-tokens');

const light = toNativeWindTheme(themes.light);
const dark = toNativeWindTheme(themes.dark);

const sizes = Object.fromEntries(
  Object.entries(primitives.size).map(([name, value]) => [
    name.replace(/[A-Z]/g, (character) => `-${character.toLowerCase()}`),
    value,
  ]),
);

/** @type {import('tailwindcss').Config} */
module.exports = {
  important: 'html',
  content: [
    './src/**/*.{ts,tsx}',
    '../../packages/ui-native/src/**/*.{ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: { ...light.colors, dark: dark.colors },
      spacing: { ...light.spacing, ...sizes },
      borderRadius: light.borderRadius,
      fontFamily: light.fontFamily,
      fontSize: light.fontSize,
      boxShadow: light.boxShadow,
      opacity: {
        disabled: primitives.opacity.disabled,
        muted: primitives.opacity.muted,
      },
    },
  },
};

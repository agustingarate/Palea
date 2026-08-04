const { primitives, themes } = require('@palea/design-tokens');

const toTailwindColorNames = (theme) =>
  Object.fromEntries(
    Object.entries(theme).map(([name, value]) => [
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
      colors: {
        ...toTailwindColorNames(themes.light),
        dark: toTailwindColorNames(themes.dark),
      },
      spacing: primitives.spacing,
      borderRadius: {
        sm: primitives.radius.sm,
        md: primitives.radius.md,
        lg: primitives.radius.lg,
      },
      fontFamily: { sans: ['Inter'] },
    },
  },
};

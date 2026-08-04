import base from './base.mjs';

export default [
  ...base,
  {
    files: ['**/*.tsx'],
    languageOptions: {
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
];

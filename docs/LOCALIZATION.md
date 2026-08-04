# Localization guide

Use `@palea/localization` for shared resources and `react-i18next` from UI
adapters. Keep domain code independent of catalogs and framework providers.

```ts
const { t } = useTranslation('projects');
t('title'); // Projects / Proyectos
t('projectCount', { count: 2 }); // 2 projects / 2 proyectos
```

Add a new key to the same namespace in both `es` and `en` resources. The package
test checks namespace parity. i18next provides interpolation, pluralization and
fallback behavior; `expo-localization` only detects the device locale.

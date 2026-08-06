import i18next from 'i18next';
import { defaultLocale, resources, supportedLocales } from './index';

describe('localization resources', () => {
  it('keeps every namespace aligned between supported locales', () => {
    for (const namespace of ['common', 'projects', 'web'] as const) {
      expect(Object.keys(resources.es[namespace]).sort()).toEqual(
        Object.keys(resources.en[namespace]).sort(),
      );
    }
  });

  it('uses i18next interpolation, pluralization, and fallback', async () => {
    const instance = i18next.createInstance();
    await instance.init({
      lng: 'en',
      fallbackLng: defaultLocale,
      supportedLngs: [...supportedLocales],
      load: 'languageOnly',
      resources,
      ns: ['common', 'projects', 'web'],
      defaultNS: 'common',
    });
    expect(instance.t('theme.label', { ns: 'common', theme: 'dark' })).toBe(
      'Theme: dark',
    );
    expect(instance.t('projectCount', { ns: 'projects', count: 1 })).toBe(
      '1 project',
    );
    expect(instance.t('projectCount', { ns: 'projects', count: 2 })).toBe(
      '2 projects',
    );
    expect(instance.t('title', { ns: 'projects', lng: 'fr-FR' })).toBe(
      'Proyectos',
    );
  });
});

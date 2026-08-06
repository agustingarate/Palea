import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { LocaleProvider, useLocale } from './LocaleProvider';

function Example() {
  const { t } = useLocale('projects');
  return <Text>{t('title')}</Text>;
}

it.each([
  ['es', 'Proyectos'],
  ['en', 'Projects'],
] as const)('renders localized text for %s', (locale, expected) => {
  render(
    <LocaleProvider locale={locale}>
      <Example />
    </LocaleProvider>,
  );
  expect(screen.getByText(expected)).toBeTruthy();
});

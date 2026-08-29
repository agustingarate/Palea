import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import HomePage from './page';
import { LocaleProvider } from '../providers/LocaleProvider';

function renderPage(locale = 'es') {
  return render(
    <LocaleProvider locale={locale}>
      <HomePage />
    </LocaleProvider>,
  );
}

it('renders the complete institutional information architecture', () => {
  renderPage();
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
    'Tomá el control',
  );
  expect(
    screen.getByRole('heading', { name: 'Centro de ayuda' }),
  ).toBeInTheDocument();
  expect(
    screen.getAllByRole('link', { name: 'Empezar ahora' })[0],
  ).toHaveAttribute('href', '#precios');
  expect(screen.getByRole('link', { name: 'Conocé Palea' })).toHaveAttribute(
    'href',
    '#sobre',
  );
  expect(screen.getByRole('contentinfo')).toBeInTheDocument();
});

it('keeps the FAQ accessible and exclusive', () => {
  renderPage();
  const first = screen.getByRole('button', { name: '¿Palea es gratis?' });
  const second = screen.getByRole('button', { name: /varios currículums/i });
  expect(first).toHaveAttribute('aria-expanded', 'true');
  fireEvent.click(second);
  expect(first).toHaveAttribute('aria-expanded', 'false');
  expect(second).toHaveAttribute('aria-expanded', 'true');
});

it('renders the institutional copy in English', () => {
  renderPage('en');
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
    'Take control',
  );
  expect(screen.getByRole('link', { name: 'Meet Palea' })).toBeInTheDocument();
});

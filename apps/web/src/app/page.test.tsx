import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import HomePage from './page';
import { LocaleProvider } from '../providers/LocaleProvider';

it('renders the institutional value proposition', () => {
  render(
    <LocaleProvider locale="es">
      <HomePage />
    </LocaleProvider>,
  );
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
    'Encontrar trabajo',
  );
  expect(
    screen.getByRole('link', { name: 'Quiero conocer Palea' }),
  ).toBeInTheDocument();
});

it('renders the institutional value proposition in English', () => {
  render(
    <LocaleProvider locale="en">
      <HomePage />
    </LocaleProvider>,
  );
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
    'Finding work',
  );
  expect(
    screen.getByRole('link', { name: 'I want to learn about Palea' }),
  ).toBeInTheDocument();
});

import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import HomePage from './page';

it('renders the institutional value proposition', () => {
  render(<HomePage />);
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
    'Encontrar trabajo',
  );
  expect(
    screen.getByRole('link', { name: 'Quiero conocer Palea' }),
  ).toBeInTheDocument();
});

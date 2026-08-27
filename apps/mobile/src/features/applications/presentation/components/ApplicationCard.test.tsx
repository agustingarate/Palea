import { render } from '@testing-library/react-native';
import { ApplicationCard } from './ApplicationCard';

describe('ApplicationCard', () => {
  it('renders the concise application metadata used by both collections', () => {
    const view = render(
      <ApplicationCard
        application={{
          id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          companyName: 'Palea',
          role: 'Product designer',
          appliedOn: '2026-08-22',
          status: 'applied',
          workMode: 'remote',
          position: 0,
        }}
        actionsLabel="Application actions"
        dateLocale="en-US"
        workModeLabel="Remote"
        onAction={jest.fn()}
      />,
    );

    expect(view.getByText('Product designer')).toBeTruthy();
    expect(view.getByText('Palea')).toBeTruthy();
    expect(view.getByText('Remote')).toBeTruthy();
    expect(view.getByText('Aug 22').props.style).toMatchObject({
      fontSize: 10,
      lineHeight: 12,
    });
    expect(
      view.getByRole('button', { name: 'Application actions' }),
    ).toBeTruthy();
  });

  it('does not format a date for a draft without an application date', () => {
    const view = render(
      <ApplicationCard
        application={{
          id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          companyName: 'Palea',
          role: 'Product designer',
          appliedOn: null,
          status: 'draft',
          workMode: 'remote',
          position: 0,
        }}
        actionsLabel="Application actions"
        dateLocale="en-US"
        workModeLabel="Remote"
        onAction={jest.fn()}
      />,
    );

    expect(view.getByText('Product designer')).toBeTruthy();
    expect(view.getByText('Remote')).toBeTruthy();
    expect(view.queryByText('Invalid Date')).toBeNull();
  });
});

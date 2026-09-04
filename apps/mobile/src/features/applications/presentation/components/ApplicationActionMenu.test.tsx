import { fireEvent, render } from '@testing-library/react-native';
import { ApplicationActionMenu } from './ApplicationActionMenu';

describe('ApplicationActionMenu', () => {
  it('exposes compact menu actions and deletes only after the caller confirms', () => {
    const onDelete = jest.fn();
    const onDismiss = jest.fn();
    const onEdit = jest.fn();
    const view = render(
      <ApplicationActionMenu
        anchor={{ x: 120, y: 80 }}
        labels={{ edit: 'Edit', remove: 'Delete', cancel: 'Close menu' }}
        onDelete={onDelete}
        onDismiss={onDismiss}
        onEdit={onEdit}
      />,
    );

    expect(view.getByRole('menu')).toBeTruthy();
    fireEvent.press(view.getByRole('menuitem', { name: 'Edit' }));
    expect(onEdit).toHaveBeenCalledTimes(1);

    fireEvent.press(view.getByRole('menuitem', { name: 'Delete' }));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });
});

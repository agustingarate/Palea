import { fireEvent, render } from '@testing-library/react-native';
import { BoardColumn, ListGroup } from './ApplicationsCollections';

const application = {
  id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  companyName: 'Palea',
  role: 'Product designer',
  appliedOn: '2026-08-22',
  status: 'applied' as const,
  workMode: 'remote' as const,
  position: 0,
};

const feedback = {
  loading: false,
  error: false,
  onRetry: jest.fn(),
  errorTitle: 'Could not load',
  errorMessage: 'Try again later',
  retryLabel: 'Retry',
};

describe('application collections', () => {
  it('shows the server total and paginates independently in the board', () => {
    const onMore = jest.fn();
    const view = render(
      <BoardColumn
        status="applied"
        title="Applied"
        items={[application]}
        total={14}
        {...feedback}
        more
        onMore={onMore}
        loadMoreLabel="Load more"
        onAction={jest.fn()}
        onDrop={jest.fn()}
        onLayout={jest.fn()}
        onCardLayout={jest.fn()}
        onDrag={jest.fn()}
        onDragMove={jest.fn()}
        isDragSource={false}
        highlighted={false}
        emptyTitle="Empty"
        emptyDescription="Drop here"
        dropIndex={null}
        onAdd={jest.fn()}
        addLabel="Add"
        dateLocale="en-US"
        workModeLabel={() => 'Remote'}
        actionsLabel="Actions"
      />,
    );

    expect(view.getByText('14')).toBeTruthy();
    fireEvent.press(view.getByRole('button', { name: 'Load more' }));
    expect(onMore).toHaveBeenCalledTimes(1);
  });

  it('keeps a failed category recoverable without hiding the group', () => {
    const onRetry = jest.fn();
    const view = render(
      <ListGroup
        status="applied"
        title="Applied"
        expanded
        total={1}
        items={[application]}
        {...feedback}
        error
        onRetry={onRetry}
        dragging={null}
        highlighted={false}
        dropIndex={null}
        onToggle={jest.fn()}
        onDrag={jest.fn()}
        onDragMove={jest.fn()}
        onAction={jest.fn()}
        onMore={jest.fn()}
        more={false}
        onDrop={jest.fn()}
        onLayout={jest.fn()}
        onCardLayout={jest.fn()}
        loadMoreLabel="Load more"
        addLabel="Add"
        onAdd={jest.fn()}
        workModeLabel={() => 'Remote'}
        actionsLabel="Actions"
        layoutVersion={0}
        dateLocale="en-US"
      />,
    );

    expect(view.getByText('Could not load')).toBeTruthy();
    fireEvent.press(view.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('renders a visually distinct empty-state heading and explanation', () => {
    const view = render(
      <BoardColumn
        status="draft"
        title="Draft"
        items={[]}
        total={0}
        {...feedback}
        more={false}
        onMore={jest.fn()}
        loadMoreLabel="Load more"
        onAction={jest.fn()}
        onDrop={jest.fn()}
        onLayout={jest.fn()}
        onCardLayout={jest.fn()}
        onDrag={jest.fn()}
        onDragMove={jest.fn()}
        isDragSource={false}
        highlighted={false}
        emptyTitle="Nothing here yet"
        emptyDescription="Review opportunities before applying."
        dropIndex={null}
        onAdd={jest.fn()}
        addLabel="Add"
        dateLocale="en-US"
        workModeLabel={() => 'Remote'}
        actionsLabel="Actions"
      />,
    );

    expect(view.getByText('Nothing here yet').props.className).toContain(
      'text-body-small',
    );
    expect(view.getByText('Nothing here yet').props.className).toContain(
      'text-text-muted',
    );
    expect(
      view.getByText('Review opportunities before applying.').props.className,
    ).toContain('text-caption');
  });
});

import { fireEvent, render } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  Button,
  BottomNavigation,
  Badge,
  Checkbox,
  CollectionFeedback,
  SegmentedControl,
  SnackbarProvider,
  StageTimeline,
  TextField,
  useSnackbar,
} from '@palea/ui-native';
import { DesignSystemCatalogScreen } from './DesignSystemCatalogScreen';

function renderWithSafeArea(node: ReactNode) {
  return render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 390, height: 844 },
        insets: { top: 44, left: 0, right: 0, bottom: 34 },
      }}
    >
      {node}
    </SafeAreaProvider>,
  );
}

function SnackbarTrigger() {
  const { showSnackbar } = useSnackbar();
  return (
    <Button
      label="Show feedback"
      onPress={() =>
        showSnackbar({ variant: 'success', message: 'Application moved' })
      }
    />
  );
}

describe('mobile design system', () => {
  it('renders an outlined asset-type badge with an interaction border', () => {
    const view = render(<Badge label="Resume" tone="interaction" outlined />);

    expect(view.toJSON()).toMatchObject({
      props: { className: expect.stringContaining('border-interaction') },
    });
  });

  it('blocks disabled and loading button callbacks', () => {
    const onPress = jest.fn();
    const view = render(
      <>
        <Button label="Disabled" disabled onPress={onPress} />
        <Button label="Loading" loading onPress={onPress} />
      </>,
    );
    const disabledButton = view.getByRole('button', { name: 'Disabled' });
    const loadingButton = view.getByRole('button', { name: 'Loading' });

    expect(disabledButton.props.accessibilityState).toMatchObject({
      disabled: true,
    });
    expect(loadingButton.props.accessibilityState).toMatchObject({
      busy: true,
      disabled: true,
    });
    expect(disabledButton.props.onPress).toBeUndefined();
    expect(loadingButton.props.onPress).toBeUndefined();
    expect(onPress).not.toHaveBeenCalled();
  });

  it('renders visible field errors and blocks disabled editing', () => {
    const onChangeText = jest.fn();
    const view = render(
      <TextField
        disabled
        error="This value is invalid"
        label="Company"
        onChangeText={onChangeText}
        value="Palea"
      />,
    );
    expect(view.getByText('This value is invalid')).toBeTruthy();
    expect(view.getByLabelText('Company').props.editable).toBe(false);
  });

  it('reports controlled checkbox and segmented changes', () => {
    const onChecked = jest.fn();
    const onSegment = jest.fn();
    const view = render(
      <>
        <Checkbox checked={false} label="Reminder" onChange={onChecked} />
        <SegmentedControl
          items={[
            { value: 'remote', label: 'Remote' },
            { value: 'hybrid', label: 'Hybrid' },
          ]}
          label="Work mode"
          onValueChange={onSegment}
          value="remote"
        />
      </>,
    );
    fireEvent.press(view.getByRole('checkbox', { name: 'Reminder' }));
    fireEvent.press(view.getByRole('radio', { name: 'Hybrid' }));
    expect(onChecked).toHaveBeenCalledWith(true);
    expect(onSegment).toHaveBeenCalledWith('hybrid');
  });

  it('renders loading, empty, and error collection states', () => {
    const view = render(
      <>
        <CollectionFeedback status="loading" rows={1} />
        <CollectionFeedback
          status="empty"
          title="Nothing here"
          message="Add the first item."
        />
        <CollectionFeedback
          status="error"
          title="Unable to load"
          message="Try again."
        />
      </>,
    );
    expect(view.getByLabelText('Loading content')).toBeTruthy();
    expect(view.getByText('Nothing here')).toBeTruthy();
    expect(view.getByText('Unable to load')).toBeTruthy();
  });

  it('gives current and completed timeline stages distinct, high-contrast markers', () => {
    const view = render(
      <StageTimeline
        items={[
          {
            id: 'current',
            title: 'Technical interview',
            completed: true,
            current: true,
            currentLabel: 'Current stage',
            statusLabel: 'Waiting for results',
            tone: 'warning',
          },
          {
            id: 'completed',
            title: 'Initial screening',
            completed: true,
            statusLabel: 'Successful',
            tone: 'success',
          },
        ]}
      />,
    );

    expect(
      view.getByTestId('stage-marker-current', {
        includeHiddenElements: true,
      }),
    ).toBeTruthy();
    expect(
      view.getByTestId('stage-marker-completed', {
        includeHiddenElements: true,
      }),
    ).toBeTruthy();
    expect(
      view.getAllByTestId('icon-Check', { includeHiddenElements: true }),
    ).toHaveLength(1);
    expect(view.getByText('Current stage')).toBeTruthy();
  });

  it('announces unread navigation counts through their destination item', () => {
    const view = render(
      <BottomNavigation
        items={[
          { value: 'home', label: 'Home', icon: 'home' },
          {
            value: 'notifications',
            label: 'Notifications',
            icon: 'bell',
            unreadCount: '2',
          },
        ]}
        value="home"
        onValueChange={jest.fn()}
        variant="horizontal"
      />,
    );

    expect(
      view.getByLabelText('Notifications, 2 unread notifications'),
    ).toBeTruthy();
  });

  it('shows and dismisses accessible snackbar feedback', () => {
    const view = render(
      <SnackbarProvider defaultDuration={0}>
        <SnackbarTrigger />
      </SnackbarProvider>,
    );

    fireEvent.press(view.getByRole('button', { name: 'Show feedback' }));
    expect(view.getByRole('alert')).toHaveTextContent('Application moved');
    fireEvent.press(view.getByRole('button', { name: 'Cerrar notificación' }));
    expect(view.queryByText('Application moved')).toBeNull();
  });

  it('smoke-renders the complete development catalog', () => {
    const view = renderWithSafeArea(<DesignSystemCatalogScreen />);
    expect(view.getByText('Palea design system')).toBeTruthy();
    expect(view.getByText('Application and CV cards')).toBeTruthy();
    expect(view.getByText('Collection states')).toBeTruthy();
  });
});

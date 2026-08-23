import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { PublicOnlyRouteGuard } from './PublicOnlyRouteGuard';

const mockUseAuthSession = jest.fn();

jest.mock('../providers/AuthProvider', () => ({
  useAuthSession: () => mockUseAuthSession(),
}));
jest.mock('expo-router', () => ({
  Redirect: ({ href }: { href: string }) => {
    const { Text: MockText } = require('react-native');
    return <MockText>{`redirect:${href}`}</MockText>;
  },
}));

describe('PublicOnlyRouteGuard', () => {
  it('waits for session restoration before rendering public content', () => {
    mockUseAuthSession.mockReturnValue({ session: null, isRestoring: true });

    const view = render(
      <PublicOnlyRouteGuard>
        <Text>Login</Text>
      </PublicOnlyRouteGuard>,
    );

    expect(view.queryByText('Login')).toBeNull();
  });

  it('redirects authenticated users to the home route', () => {
    mockUseAuthSession.mockReturnValue({
      session: { userId: 'user-1', email: 'user@example.com' },
      isRestoring: false,
    });

    const view = render(
      <PublicOnlyRouteGuard>
        <Text>Login</Text>
      </PublicOnlyRouteGuard>,
    );

    expect(view.getByText('redirect:/')).toBeTruthy();
    expect(view.queryByText('Login')).toBeNull();
  });

  it('allows guests to access login and registration', () => {
    mockUseAuthSession.mockReturnValue({ session: null, isRestoring: false });

    const view = render(
      <PublicOnlyRouteGuard>
        <Text>Login</Text>
      </PublicOnlyRouteGuard>,
    );

    expect(view.getByText('Login')).toBeTruthy();
  });
});

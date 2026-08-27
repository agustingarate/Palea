import { render, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import type { ReactNode } from 'react';
import { PostAuthRouteGuard } from './PostAuthRouteGuard';

const mockUseAuthSession = jest.fn();
const mockUseQuery = jest.fn();
const mockUseDependency = jest.fn();

jest.mock('../providers/AuthProvider', () => ({
  useAuthSession: () => mockUseAuthSession(),
}));
jest.mock('@tanstack/react-query', () => ({
  useQuery: () => mockUseQuery(),
}));
jest.mock('@/core/di/DependenciesProvider', () => ({
  useDependency: () => mockUseDependency(),
}));
jest.mock('@/core/localization/LocaleProvider', () => ({
  useLocale: () => ({ t: (key: string) => key }),
}));
jest.mock('@/core/di/dependencies', () => ({
  dependencyTokens: { onboardingRepository: 'onboardingRepository' },
}));
jest.mock('expo-router', () => ({
  Redirect: ({ href }: { href: string }) => <Text>{`redirect:${href}`}</Text>,
}));
jest.mock('@palea/ui-native', () => ({
  AppText: ({ children }: { children: ReactNode }) => <Text>{children}</Text>,
  Button: ({ label, onPress }: { label: string; onPress: () => void }) => (
    <Text onPress={onPress}>{label}</Text>
  ),
  Screen: ({ children }: { children: ReactNode }) => <>{children}</>,
  Spinner: ({ label }: { label: string }) => <Text>{label}</Text>,
}));

describe('PostAuthRouteGuard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseDependency.mockReturnValue({ getAccount: jest.fn() });
    mockUseAuthSession.mockReturnValue({
      session: { userId: 'user-1' },
      isRestoring: false,
    });
  });

  it('does not render protected content while session restores', () => {
    mockUseAuthSession.mockReturnValue({ session: null, isRestoring: true });
    const view = render(<PostAuthRouteGuard><Text>Protected</Text></PostAuthRouteGuard>);
    expect(view.queryByText('Protected')).toBeNull();
  });

  it('redirects guests and incomplete accounts', () => {
    mockUseAuthSession.mockReturnValue({ session: null, isRestoring: false });
    expect(render(<PostAuthRouteGuard><Text>Protected</Text></PostAuthRouteGuard>).getByText('redirect:/auth/login')).toBeTruthy();

    mockUseAuthSession.mockReturnValue({ session: { userId: 'user-1' }, isRestoring: false });
    mockUseQuery.mockReturnValue({ isPending: false, isError: false, data: { missing: ['personal'], onboardingCompletedAt: null } });
    expect(render(<PostAuthRouteGuard><Text>Protected</Text></PostAuthRouteGuard>).getByText('redirect:/auth/personal-data')).toBeTruthy();
  });

  it('renders complete accounts and exposes retry on lookup failure', () => {
    mockUseQuery.mockReturnValue({ isPending: false, isError: false, data: { missing: [], onboardingCompletedAt: '2026-08-01' } });
    expect(render(<PostAuthRouteGuard><Text>Protected</Text></PostAuthRouteGuard>).getByText('Protected')).toBeTruthy();

    const refetch = jest.fn();
    mockUseQuery.mockReturnValue({ isPending: false, isError: true, refetch });
    const view = render(<PostAuthRouteGuard><Text>Protected</Text></PostAuthRouteGuard>);
    expect(view.queryByText('Protected')).toBeNull();
    fireEvent.press(view.getByText('route.retry'));
    expect(refetch).toHaveBeenCalledTimes(1);
  });
});

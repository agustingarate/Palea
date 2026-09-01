import NetInfo from '@react-native-community/netinfo';
import {
  focusManager,
  onlineManager,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { useEffect, useState } from 'react';
import { AppState, type AppStateStatus, Platform } from 'react-native';
import { useColorScheme } from 'nativewind';
import { getLocales } from 'expo-localization';
import { DependenciesProvider } from '../di/DependenciesProvider';
import { LocaleProvider } from '../localization/LocaleProvider';
import { AuthProvider } from '@/features/auth/presentation/providers/AuthProvider';
import { SnackbarProvider } from '@palea/ui-native';

onlineManager.setEventListener((setOnline) =>
  NetInfo.addEventListener((state) => setOnline(Boolean(state.isConnected))),
);

export function AppProviders({ children }: PropsWithChildren) {
  const locale = getLocales()[0]?.languageTag ?? 'es';
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: 1, staleTime: 30_000 },
          mutations: { retry: 0 },
        },
      }),
  );
  const { setColorScheme } = useColorScheme();
  // const themePreference = useThemeStore((state) => state.preference);

  // Follow the platform preference, including the library's approved dark theme.
  useEffect(() => setColorScheme('light'), [setColorScheme]);

  useEffect(() => {
    const onChange = (status: AppStateStatus) => {
      if (Platform.OS !== 'web') focusManager.setFocused(status === 'active');
    };
    const subscription = AppState.addEventListener('change', onChange);
    return () => subscription.remove();
  }, []);

  return (
    <LocaleProvider locale={locale}>
      <DependenciesProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <SnackbarProvider>{children}</SnackbarProvider>
          </AuthProvider>
        </QueryClientProvider>
      </DependenciesProvider>
    </LocaleProvider>
  );
}

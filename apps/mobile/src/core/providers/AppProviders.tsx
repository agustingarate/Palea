import NetInfo from '@react-native-community/netinfo';
import {
  focusManager,
  onlineManager,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { useEffect, useState } from 'react';
import {
  AppState,
  type AppStateStatus,
  Platform,
  useColorScheme as useSystemColorScheme,
} from 'react-native';
import { useColorScheme } from 'nativewind';
import { DependenciesProvider } from '../di/DependenciesProvider';
import { useThemeStore } from '../state/themeStore';
import { getLocales } from 'expo-localization';
import { LocaleProvider } from '../localization/LocaleProvider';
import { AuthProvider } from '@/features/auth/presentation/AuthProvider';

onlineManager.setEventListener((setOnline) =>
  NetInfo.addEventListener((state) => setOnline(Boolean(state.isConnected))),
);

export function AppProviders({ children }: PropsWithChildren) {
  const locale = getLocales()[0]?.languageTag ?? 'es';
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
      }),
  );
  const preference = useThemeStore((state) => state.preference);
  const systemScheme = useSystemColorScheme();
  const { setColorScheme } = useColorScheme();

  useEffect(
    () =>
      setColorScheme(
        preference === 'system' ? (systemScheme ?? 'light') : preference,
      ),
    [preference, setColorScheme, systemScheme],
  );
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
        <AuthProvider>
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        </AuthProvider>
      </DependenciesProvider>
    </LocaleProvider>
  );
}

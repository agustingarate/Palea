import type { PropsWithChildren } from 'react';
import { View } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import {
  BottomNavigation,
  Screen,
  TopAppBar,
  useResponsiveLayout,
  useSnackbar,
} from '@palea/ui-native';
import { ProductDesktopNavigation } from '@/common/presentation/components/ProductDesktopNavigation';
import { useLocale } from '@/core/localization/LocaleProvider';
import { useSignOut } from '@/core/session/useSignOut';

export function ProfileProductShell({ children }: PropsWithChildren) {
  const layout = useResponsiveLayout();
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useLocale('applications');
  const { t: profileT } = useLocale('profile');
  const { showSnackbar } = useSnackbar();
  const signOut = useSignOut();
  const navigate = (destination: string) => {
    if (destination === 'applications') router.push('/');
    else if (destination === 'resumes') router.push('/resumes');
    else if (destination === 'profile') router.push('/profile' as never);
    else showSnackbar({ variant: 'info', message: t('nav.pending') });
  };
  const logout = async () => {
    try {
      await signOut.mutateAsync();
      router.replace('/auth/login');
    } catch {
      showSnackbar({ variant: 'error', message: t('nav.logoutError') });
    }
  };
  return (
    <Screen edges={['top', 'bottom']}>
      <View className="flex-1 flex-row">
        {layout.isExpanded ? (
          <ProductDesktopNavigation
            active="profile"
            labels={{
              applications: t('nav.applications'),
              metrics: t('nav.metrics'),
              resumes: t('nav.resumes'),
              profile: t('nav.profile'),
              add: t('add'),
              tracker: t('sidebar.tracker'),
              logout: t('nav.logout'),
            }}
            signingOut={signOut.isPending}
            onAdd={() => router.push('/applications/new')}
            onPending={navigate}
            onSignOut={() => void logout()}
          />
        ) : null}
        <View className="min-w-0 flex-1">
          {!layout.isExpanded ? (
            pathname === '/profile' ? (
              <TopAppBar title={profileT('title')} />
            ) : null
          ) : null}
          <View className="min-h-0 flex-1">{children}</View>
          {!layout.isExpanded ? (
            <BottomNavigation
              value="profile"
              onValueChange={navigate}
              items={[
                {
                  value: 'applications',
                  label: t('nav.applications'),
                  icon: 'briefcase',
                },
                { value: 'metrics', label: t('nav.metrics'), icon: 'barChart' },
                { value: 'resumes', label: t('nav.resumes'), icon: 'fileText' },
                { value: 'profile', label: t('nav.profile'), icon: 'user' },
              ]}
            />
          ) : null}
        </View>
      </View>
    </Screen>
  );
}

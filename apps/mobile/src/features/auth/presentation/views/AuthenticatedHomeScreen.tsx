import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { AppText, Button, FocusedFormLayout } from '@palea/ui-native';
import { useAuthSession } from '../providers/AuthProvider';
import { useDependency } from '@/core/di/DependenciesProvider';
import { dependencyTokens } from '@/core/di/dependencies';
import { useSignOut } from '@/core/session/useSignOut';
import { useLocale } from '@/core/localization/LocaleProvider';
import { resolvePostAuthRoute } from '../navigation/resolvePostAuthRoute';

export function AuthenticatedHomeScreen() {
  const { t } = useLocale('auth');
  const { session, isRestoring } = useAuthSession();
  const signOutMutation = useSignOut();
  const onboarding = useDependency(dependencyTokens.onboardingRepository);
  const router = useRouter();
  const [notice, setNotice] = useState<string | null>(null);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  useEffect(() => {
    if (!isRestoring && !session) router.replace('/auth/login');
  }, [isRestoring, router, session]);

  useEffect(() => {
    let active = true;
    if (!session)
      return () => {
        active = false;
      };
    void onboarding
      .getAccount()
      .then((account) => {
        if (!active) return;
        const destination = resolvePostAuthRoute(account);
        if (destination !== '/') router.replace(destination);
        else if (account.missing.length > 0) {
          setNotice(
            'Tu perfil tiene información profesional pendiente. Podrás completarla desde tu perfil cuando esa sección esté disponible.',
          );
        }
      })
      .catch(() => {
        if (active)
          setNotice('No pudimos verificar los datos pendientes de tu perfil.');
      });
    return () => {
      active = false;
    };
  }, [onboarding, router, session]);

  const signOut = async () => {
    setLogoutError(null);
    try {
      await signOutMutation.mutateAsync();
    } catch {
      setLogoutError('No pudimos cerrar sesión. Volvé a intentarlo.');
    }
  };

  if (isRestoring || !session) return null;
  return (
    <FocusedFormLayout title={t('loggedIn.title')}>
      {notice ? <AppText tone="info">{notice}</AppText> : null}
      {logoutError ? <AppText tone="danger">{logoutError}</AppText> : null}
      <Button
        label={t('logout')}
        variant="secondary"
        loading={signOutMutation.isPending}
        onPress={() => void signOut()}
      />
    </FocusedFormLayout>
  );
}

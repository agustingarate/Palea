import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { AppText, Button, FocusedFormLayout } from '@palea/ui-native';
import { useAuthSession } from '../providers/AuthProvider';
import { useDependency } from '@/core/di/DependenciesProvider';
import { dependencyTokens } from '@/core/di/dependencies';
import { useLocale } from '@/core/localization/LocaleProvider';

export function AuthenticatedHomeScreen() {
  const { t } = useLocale('auth');
  const { session, isRestoring } = useAuthSession();
  const auth = useDependency(dependencyTokens.authRepository);
  const onboarding = useDependency(dependencyTokens.onboardingRepository);
  const router = useRouter();
  const [notice, setNotice] = useState<string | null>(null);
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const [isSigningOut, setSigningOut] = useState(false);

  useEffect(() => {
    if (!isRestoring && !session) router.replace('/auth/login');
  }, [isRestoring, router, session]);

  useEffect(() => {
    let active = true;
    if (!session) return () => { active = false; };
    void onboarding.getAccount().then((account) => {
      if (active && account.missing.length > 0) {
        setNotice('Tu perfil tiene información pendiente. Podrás completarla desde tu perfil cuando esa sección esté disponible.');
      }
    }).catch(() => {
      if (active) setNotice('No pudimos verificar los datos pendientes de tu perfil.');
    });
    return () => { active = false; };
  }, [onboarding, session]);

  const signOut = async () => {
    setLogoutError(null);
    setSigningOut(true);
    try { await auth.signOut(); }
    catch { setLogoutError('No pudimos cerrar sesión. Volvé a intentarlo.'); }
    finally { setSigningOut(false); }
  };

  if (isRestoring || !session) return null;
  return <FocusedFormLayout title={t('loggedIn.title')}>
    {notice ? <AppText tone="info">{notice}</AppText> : null}
    {logoutError ? <AppText tone="danger">{logoutError}</AppText> : null}
    <Button label={t('logout')} variant="secondary" loading={isSigningOut} onPress={() => void signOut()} />
  </FocusedFormLayout>;
}
import { AppText, FocusedFormLayout } from '@palea/ui-native';
import { useAuthCallbackViewModel } from '../viewmodels/useAuthCallbackViewModel';
export function OAuthCallbackScreen() {
  const { error } = useAuthCallbackViewModel();
  return (
    <FocusedFormLayout title="Completando inicio de sesión">
      <AppText tone={error ? 'danger' : 'muted'}>
        {error ?? 'Estamos verificando tu cuenta…'}
      </AppText>
    </FocusedFormLayout>
  );
}

import { PublicOnlyRouteGuard } from '@/features/auth/presentation/components/PublicOnlyRouteGuard';
import { LoginScreen } from '@/features/auth/presentation/views/LoginScreen';

export default function LoginRoute() {
  return (
    <PublicOnlyRouteGuard>
      <LoginScreen />
    </PublicOnlyRouteGuard>
  );
}

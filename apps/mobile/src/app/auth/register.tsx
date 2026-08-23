import { PublicOnlyRouteGuard } from '@/features/auth/presentation/components/PublicOnlyRouteGuard';
import { RegisterScreen } from '@/features/auth/presentation/views/RegisterScreen';

export default function RegisterRoute() {
  return (
    <PublicOnlyRouteGuard>
      <RegisterScreen />
    </PublicOnlyRouteGuard>
  );
}

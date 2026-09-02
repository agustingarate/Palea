import { PostAuthRouteGuard } from '@/features/auth/presentation/components/PostAuthRouteGuard';
import { ProfileProductShell } from '@/features/profile/presentation/components/ProfileProductShell';
import { ProfileRoleScreen } from '@/features/profile/presentation/views/ProfileRoleScreen';

export default function ProfileRoleRoute() {
  return (
    <PostAuthRouteGuard>
      <ProfileProductShell>
        <ProfileRoleScreen />
      </ProfileProductShell>
    </PostAuthRouteGuard>
  );
}

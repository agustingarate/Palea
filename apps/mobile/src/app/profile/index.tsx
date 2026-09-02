import { PostAuthRouteGuard } from '@/features/auth/presentation/components/PostAuthRouteGuard';
import { ProfileProductShell } from '@/features/profile/presentation/components/ProfileProductShell';
import { ProfileOverviewScreen } from '@/features/profile/presentation/views/ProfileOverviewScreen';

export default function ProfileRoute() {
  return (
    <PostAuthRouteGuard>
      <ProfileProductShell>
        <ProfileOverviewScreen />
      </ProfileProductShell>
    </PostAuthRouteGuard>
  );
}

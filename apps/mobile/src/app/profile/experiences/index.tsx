import { PostAuthRouteGuard } from '@/features/auth/presentation/components/PostAuthRouteGuard';
import { ProfileProductShell } from '@/features/profile/presentation/components/ProfileProductShell';
import { ProfileExperiencesScreen } from '@/features/profile/presentation/experiences/ProfileExperiencesScreen';

export default function ProfileExperiencesRoute() {
  return (
    <PostAuthRouteGuard>
      <ProfileProductShell>
        <ProfileExperiencesScreen />
      </ProfileProductShell>
    </PostAuthRouteGuard>
  );
}

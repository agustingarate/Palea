import { PostAuthRouteGuard } from '@/features/auth/presentation/components/PostAuthRouteGuard';
import { ProfileProductShell } from '@/features/profile/presentation/components/ProfileProductShell';
import { ProfileExperienceFormScreen } from '@/features/profile/presentation/experiences/ProfileExperienceFormScreen';

export default function NewProfileExperienceRoute() {
  return (
    <PostAuthRouteGuard>
      <ProfileProductShell>
        <ProfileExperienceFormScreen />
      </ProfileProductShell>
    </PostAuthRouteGuard>
  );
}

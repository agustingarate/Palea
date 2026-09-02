import { PostAuthRouteGuard } from '@/features/auth/presentation/components/PostAuthRouteGuard';
import { ProfileProductShell } from '@/features/profile/presentation/components/ProfileProductShell';
import { ProfileSkillsScreen } from '@/features/profile/presentation/skills/ProfileSkillsScreen';

export default function ProfileSkillsRoute() {
  return (
    <PostAuthRouteGuard>
      <ProfileProductShell>
        <ProfileSkillsScreen />
      </ProfileProductShell>
    </PostAuthRouteGuard>
  );
}

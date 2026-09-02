import { useLocalSearchParams } from 'expo-router';
import { PostAuthRouteGuard } from '@/features/auth/presentation/components/PostAuthRouteGuard';
import { ProfileProductShell } from '@/features/profile/presentation/components/ProfileProductShell';
import { ProfileExperienceFormScreen } from '@/features/profile/presentation/experiences/ProfileExperienceFormScreen';

export default function EditProfileExperienceRoute() {
  const params = useLocalSearchParams<{ experienceId?: string | string[] }>();
  const experienceId = Array.isArray(params.experienceId)
    ? params.experienceId[0]
    : params.experienceId;
  return (
    <PostAuthRouteGuard>
      <ProfileProductShell>
        <ProfileExperienceFormScreen experienceId={experienceId} />
      </ProfileProductShell>
    </PostAuthRouteGuard>
  );
}

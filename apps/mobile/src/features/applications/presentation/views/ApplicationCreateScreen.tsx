import { PostAuthRouteGuard } from '@/features/auth/presentation/components/PostAuthRouteGuard';
import { ApplicationCreateForm } from '../create/ApplicationCreateForm';

export function ApplicationCreateScreen() {
  return (
    <PostAuthRouteGuard>
      <ApplicationCreateForm />
    </PostAuthRouteGuard>
  );
}

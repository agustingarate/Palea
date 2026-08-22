import { OnboardingRouteGuard } from '@/features/auth/presentation/components/OnboardingRouteGuard';
import { ProfileOnboardingScreen } from '@/features/auth/presentation/onboarding/views/ProfileOnboardingScreen';

export default function ProfileOnboardingRoute() {
  return <OnboardingRouteGuard><ProfileOnboardingScreen /></OnboardingRouteGuard>;
}
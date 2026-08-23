import { OnboardingRouteGuard } from '@/features/auth/presentation/components/OnboardingRouteGuard';
import { WorkOnboardingScreen } from '@/features/auth/presentation/onboarding/views/WorkOnboardingScreen';

export default function WorkOnboardingRoute() {
  return (
    <OnboardingRouteGuard>
      <WorkOnboardingScreen />
    </OnboardingRouteGuard>
  );
}

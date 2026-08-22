import { OnboardingRouteGuard } from '@/features/auth/presentation/components/OnboardingRouteGuard';
import { SkillsOnboardingScreen } from '@/features/auth/presentation/onboarding/views/SkillsOnboardingScreen';

export default function SkillsOnboardingRoute() {
  return <OnboardingRouteGuard><SkillsOnboardingScreen /></OnboardingRouteGuard>;
}
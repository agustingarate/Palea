import { View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import {
  AppText,
  Button,
  CollectionFeedback,
  Notice,
  ScrollScreen,
} from '@palea/ui-native';
import { useLocale } from '@/core/localization/LocaleProvider';
import {
  ProfileCompletionNotice,
  ProfileExperiencePreview,
  ProfilePersonalInformationCard,
  ProfileRoleSummaryCard,
  ProfileSkillsPreview,
} from '../components/ProfileOverviewCards';
import { toProfileLocale } from '../viewmodels/profileLocale';
import { useProfileOverviewViewModel } from '../viewmodels/useProfileOverviewViewModel';
import { useResponsiveLayout } from '@palea/ui-native';

export function ProfileOverviewScreen() {
  const { t, i18n } = useLocale('profile');
  const router = useRouter();
  const layout = useResponsiveLayout();
  const locale = toProfileLocale(i18n.language);
  const viewModel = useProfileOverviewViewModel(locale);
  const open = (
    path: '/profile/role' | '/profile/experiences' | '/profile/skills',
  ) => router.push(path as Href);
  const openNext = () => {
    const section = viewModel.profile?.completion.nextSection;
    if (section === 'role') open('/profile/role');
    if (section === 'experience') open('/profile/experiences');
    if (section === 'skills') open('/profile/skills');
  };

  if (viewModel.isLoading) {
    return (
      <ScrollScreen>
        <CollectionFeedback status="loading" rows={4} />
      </ScrollScreen>
    );
  }
  if (!viewModel.profile) {
    return (
      <ScrollScreen>
        <CollectionFeedback
          status="error"
          title={t('errorTitle')}
          message={t('errorMessage')}
          actionLabel={t('retry')}
          onAction={() => void viewModel.refresh()}
        />
      </ScrollScreen>
    );
  }

  const profile = viewModel.profile;
  return (
    <ScrollScreen contentClassName="gap-6">
      {layout.isExpanded ? (
        <View className="gap-1">
          <AppHeading title={t('title')} subtitle={t('subtitle')} />
        </View>
      ) : null}
      {viewModel.error ? (
        <View className="gap-2">
          <Notice
            title={t('errorTitle')}
            message={t('errorMessage')}
            tone="danger"
          />
          <Button
            label={t('retry')}
            variant="ghost"
            size="sm"
            onPress={() => void viewModel.refresh()}
          />
        </View>
      ) : null}
      <View
        className={layout.isExpanded ? 'flex-row gap-6' : 'gap-6'}
        style={
          layout.isExpanded ? { alignSelf: 'center', maxWidth: 880 } : undefined
        }
      >
        <View
          className="gap-6"
          style={layout.isExpanded ? { flex: 0.85 } : undefined}
        >
          <ProfilePersonalInformationCard
            profile={profile}
            locale={i18n.language}
            t={t}
          />
        </View>
        <View
          className="gap-6"
          style={layout.isExpanded ? { flex: 1.15 } : undefined}
        >
          <ProfileCompletionNotice
            profile={profile}
            t={t}
            onOpenNext={openNext}
          />
          <ProfileRoleSummaryCard
            profile={profile}
            t={t}
            onEdit={() => open('/profile/role')}
          />
          <ProfileExperiencePreview
            profile={profile}
            locale={i18n.language}
            t={t}
            onOpen={() => open('/profile/experiences')}
          />
          <ProfileSkillsPreview
            profile={profile}
            t={t}
            onOpen={() => open('/profile/skills')}
          />
        </View>
      </View>
    </ScrollScreen>
  );
}

function AppHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <>
      <AppText variant="screenTitle">{title}</AppText>
      <AppText tone="muted">{subtitle}</AppText>
    </>
  );
}

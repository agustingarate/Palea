import { useRouter } from 'expo-router';
import {
  AppText,
  Button,
  Chip,
  FileUploadField,
  Notice,
  useResponsiveLayout,
} from '@palea/ui-native';
import { View } from 'react-native';
import { AuthFormLayout } from '../../components/AuthFormLayout';
import { useOnboardingSkillsViewModel } from '../viewmodels/useOnboardingSkillsViewModel';
import { useLocale } from '@/core/localization/LocaleProvider';

export function SkillsOnboardingScreen() {
  const vm = useOnboardingSkillsViewModel();
  const router = useRouter();
  const layout = useResponsiveLayout();
  const { t } = useLocale('auth');
  const { t: resumeT } = useLocale('resumes');
  const isUploading = vm.upload.isPending;
  const isFinishing = vm.finish.isPending;
  const error = vm.upload.isError
    ? resumeT('uploadError')
    : vm.finish.isError
      ? t('onboarding.skills.finishError')
      : undefined;
  const skills = vm.catalog.data?.skills ?? [];
  const actionStyle =
    layout.isWeb && !layout.isCompact ? undefined : { flex: 1 };
  return (
    <AuthFormLayout
      title={t('onboarding.skills.title')}
      description={t('onboarding.skills.description')}
      currentStep={3}
    >
      <View className="gap-2">
        <AppText variant="label">{t('onboarding.skills.label')}</AppText>
        <View className="flex-row flex-wrap gap-2">
          {skills.map((skill) => (
            <Chip
              key={skill.id}
              label={skill.label}
              selected={vm.skills.includes(skill.id)}
              onPress={() =>
                vm.setSkills(
                  vm.skills.includes(skill.id)
                    ? vm.skills.filter((id) => id !== skill.id)
                    : [...vm.skills, skill.id].slice(0, 10),
                )
              }
            />
          ))}
        </View>
      </View>
      <View className="gap-3">
        <FileUploadField
          label={t('onboarding.skills.resume')}
          acceptedTypes="PDF"
          maxSizeLabel={
            vm.policy.data
              ? `${vm.policy.data.maxSizeBytes / 1024 / 1024} MiB`
              : resumeT('loadingPolicy')
          }
          fileName={vm.primaryResume?.displayName}
          isLoading={isUploading}
          progress={vm.uploadProgress}
          disabled={
            isFinishing ||
            !vm.policy.data ||
            vm.policy.data.usedResumes >= vm.policy.data.maxResumes
          }
          error={error ?? undefined}
          onPress={() => vm.upload.mutate()}
        />
        <Notice
          title={t('onboarding.resumeNotice.title')}
          message={t('onboarding.resumeNotice.message')}
          tone="info"
        />
      </View>
      <View className="flex-row justify-start gap-3">
        <Button
          label={t('onboarding.skills.back')}
          variant="ghost"
          leadingIcon="arrowBack"
          style={actionStyle}
          disabled={isUploading || isFinishing}
          onPress={() => router.back()}
        />
        <Button
          label={t('onboarding.skills.finish')}
          style={actionStyle}
          loading={isFinishing}
          disabled={isUploading}
          onPress={() => vm.finish.mutate(false)}
        />
      </View>
      <Button
        label={t('onboarding.skills.skip')}
        variant="ghost"
        fullWidth
        disabled={isUploading || isFinishing}
        onPress={() => vm.finish.mutate(true)}
      />
    </AuthFormLayout>
  );
}

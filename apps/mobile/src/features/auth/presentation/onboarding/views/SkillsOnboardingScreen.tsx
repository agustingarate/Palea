import { useState } from 'react';
import * as DocumentPicker from 'expo-document-picker';
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
import { useOnboardingViewModel } from '../viewmodels/useOnboardingViewModel';
import { useLocale } from '@/core/localization/LocaleProvider';

export function SkillsOnboardingScreen() {
  const vm = useOnboardingViewModel();
  const router = useRouter();
  const layout = useResponsiveLayout();
  const { t } = useLocale('auth');
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>();
  const [isUploading, setIsUploading] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const skills = vm.catalog.data?.skills ?? [];
  const actionStyle =
    layout.isWeb && !layout.isCompact ? undefined : { flex: 1 };
  const upload = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/pdf',
      copyToCacheDirectory: true,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    if (!asset) return;
    setIsUploading(true);
    setUploadProgress(0);
    setError(null);
    try {
      const bytes = new Uint8Array(
        await (await fetch(asset.uri)).arrayBuffer(),
      );
      const sizeBytes = asset.size ?? bytes.byteLength;
      if (sizeBytes > 10 * 1024 * 1024) throw new Error('resume.maxSize');
      await vm.repository.uploadResume(
        { displayName: asset.name, mimeType: 'application/pdf', sizeBytes },
        {
          name: asset.name,
          mimeType: 'application/pdf',
          sizeBytes,
          readBytes: async () => bytes,
        },
        setUploadProgress,
      );
      setFileName(asset.name);
    } catch {
      setError('No pudimos cargar el CV. Verificá que sea un PDF válido.');
    } finally {
      setIsUploading(false);
    }
  };
  const finish = async () => {
    setIsFinishing(true);
    setError(null);
    try {
      await vm.repository.saveSkills({ skillIds: vm.skills });
      await vm.finish();
    } catch {
      setError('No pudimos finalizar el onboarding.');
    } finally {
      setIsFinishing(false);
    }
  };
  return (
    <AuthFormLayout
      title="Habilidades y CV"
      description={t('onboarding.skills.description')}
      currentStep={3}
    >
      <View className="gap-2">
        <AppText variant="label">Habilidades (máximo 10)</AppText>
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
          label="CV (opcional)"
          acceptedTypes="PDF"
          maxSizeLabel="10 MiB"
          fileName={fileName}
          isLoading={isUploading}
          progress={uploadProgress}
          disabled={isFinishing}
          error={error ?? undefined}
          onPress={() => void upload()}
        />
        <Notice
          title={t('onboarding.resumeNotice.title')}
          message={t('onboarding.resumeNotice.message')}
          tone="info"
        />
      </View>
      <View className="flex-row justify-start gap-3">
        <Button
          label="Volver"
          variant="ghost"
          leadingIcon="arrowBack"
          style={actionStyle}
          disabled={isUploading || isFinishing}
          onPress={() => router.back()}
        />
        <Button
          label="Finalizar"
          style={actionStyle}
          loading={isFinishing}
          disabled={isUploading}
          onPress={() => void finish()}
        />
      </View>
      <Button
        label="Omitir este paso"
        variant="ghost"
        fullWidth
        disabled={isUploading || isFinishing}
        onPress={() => void vm.finish()}
      />
    </AuthFormLayout>
  );
}

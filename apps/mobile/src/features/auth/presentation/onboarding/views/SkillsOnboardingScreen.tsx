import { useState } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
import { AppText, Button, Checkbox, FileTrigger } from '@palea/ui-native';
import { AuthFormLayout } from '../../components/AuthFormLayout';
import { useOnboardingViewModel } from '../viewmodels/useOnboardingViewModel';

export function SkillsOnboardingScreen() {
  const vm = useOnboardingViewModel(); const router = useRouter(); const [error, setError] = useState<string | null>(null); const [fileName, setFileName] = useState<string>(); const [loading, setLoading] = useState(false);
  const skills = vm.catalog.data?.skills ?? [];
  const upload = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true });
    if (result.canceled) return;
    const asset = result.assets[0];
    if (!asset) return;
    if (asset.size && asset.size > 10 * 1024 * 1024) { setError('El CV debe pesar hasta 10 MiB.'); return; }
    setLoading(true); setError(null);
    try {
      const bytes = new Uint8Array(await (await fetch(asset.uri)).arrayBuffer());
      await vm.repository.uploadResume({ displayName: asset.name, mimeType: 'application/pdf', sizeBytes: bytes.byteLength }, { name: asset.name, mimeType: 'application/pdf', sizeBytes: bytes.byteLength, readBytes: async () => bytes });
      setFileName(asset.name);
    } catch { setError('No pudimos cargar el CV. Verificá que sea un PDF válido.'); }
    finally { setLoading(false); }
  };
  const finish = async () => { setLoading(true); setError(null); try { await vm.repository.saveSkills({ skillIds: vm.skills }); await vm.finish(false); } catch { setError('No pudimos finalizar el onboarding.'); } finally { setLoading(false); } };
  return <AuthFormLayout title="Habilidades y CV" description="Podés cargar un CV PDF opcional. Si lo hacés, será tu CV principal." currentStep={3} onBack={() => router.back()}>
    <AppText variant="label">Habilidades (máximo 10)</AppText>
    {skills.map((skill) => <Checkbox key={skill.id} label={skill.label} checked={vm.skills.includes(skill.id)} onChange={(checked) => vm.setSkills(checked ? [...vm.skills, skill.id].slice(0, 10) : vm.skills.filter((id) => id !== skill.id))} />)}
    <FileTrigger label="CV (opcional)" placeholder={fileName ?? 'Elegí un PDF de hasta 10 MiB'} value={fileName} onPress={() => void upload()} disabled={loading} />
    {error ? <AppText tone="danger">{error}</AppText> : null}
    <Button label="Finalizar" fullWidth loading={loading} onPress={() => void finish()} />
    <Button label="Omitir este paso" variant="ghost" fullWidth disabled={loading} onPress={() => void vm.finish(false)} />
  </AuthFormLayout>;
}

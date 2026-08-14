import { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import type { ExperienceBand, Locale } from '@palea/contracts';
import { useDependency } from '@/core/di/DependenciesProvider';
import { dependencyTokens } from '@/core/di/dependencies';
import {
  Action,
  AuthScaffold,
  Choice,
  ErrorMessage,
  Field,
} from './components';

function useCatalogs() {
  const { i18n } = useTranslation();
  const repository = useDependency(dependencyTokens.onboardingRepository);
  const locale = (i18n.language.startsWith('en') ? 'en' : 'es') as Locale;
  return useQuery({
    queryKey: ['onboarding-catalogs', locale],
    queryFn: () => repository.catalogs(locale),
  });
}

export function ProfileOnboardingScreen() {
  const { t } = useTranslation();
  const repository = useDependency(dependencyTokens.onboardingRepository);
  const catalogs = useCatalogs();
  const [role, setRole] = useState('');
  const [band, setBand] = useState<ExperienceBand>('zero_to_one');
  const [interests, setInterests] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const save = async () => {
    try {
      await repository.saveProfile({
        roleDescription: role,
        experienceBand: band,
        interestIds: interests,
      });
      router.push('/onboarding/work');
    } catch {
      setError(t('auth.error'));
    }
  };
  return (
    <AuthScaffold title={t('onboarding.profileTitle')}>
      <Field
        label={t('onboarding.role')}
        value={role}
        onChangeText={setRole}
        multiline
      />
      <Text>{t('onboarding.experience')}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {(
          ['zero_to_one', 'two_to_four', 'five_to_eight', 'over_eight'] as const
        ).map((item) => (
          <Choice
            key={item}
            label={t(`onboarding.experienceBand.${item}`)}
            selected={band === item}
            onPress={() => setBand(item)}
          />
        ))}
      </View>
      <Text>{t('onboarding.interests')}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {catalogs.data?.interests.map((item) => (
          <Choice
            key={item.id}
            label={item.label}
            selected={interests.includes(item.id)}
            onPress={() =>
              setInterests((current) =>
                current.includes(item.id)
                  ? current.filter((id) => id !== item.id)
                  : current.length < 3
                    ? [...current, item.id]
                    : current,
              )
            }
          />
        ))}
      </View>
      <ErrorMessage
        message={error ?? (catalogs.isError ? t('auth.error') : null)}
      />
      <Action
        label={t('auth.continue')}
        disabled={!role || !interests.length}
        onPress={() => void save()}
      />
      <Action
        secondary
        label={t('auth.skip')}
        onPress={() => router.push('/onboarding/work')}
      />
    </AuthScaffold>
  );
}

export function WorkOnboardingScreen() {
  const { t } = useTranslation();
  const repository = useDependency(dependencyTokens.onboardingRepository);
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [startedOn, setStartedOn] = useState('');
  const [endedOn, setEndedOn] = useState('');
  const [current, setCurrent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const save = async () => {
    try {
      await repository.saveWorkExperience({
        companyName: company,
        role,
        startedOn,
        endedOn: current || !endedOn ? null : endedOn,
        isCurrent: current,
      });
      router.push('/onboarding/skills');
    } catch {
      setError(t('auth.error'));
    }
  };
  return (
    <AuthScaffold title={t('onboarding.workTitle')}>
      <Field
        label={t('onboarding.company')}
        value={company}
        onChangeText={setCompany}
      />
      <Field
        label={t('onboarding.workRole')}
        value={role}
        onChangeText={setRole}
      />
      <Field
        label={t('onboarding.startedOn')}
        value={startedOn}
        onChangeText={setStartedOn}
      />
      <Field
        label={t('onboarding.endedOn')}
        value={endedOn}
        onChangeText={setEndedOn}
        editable={!current}
      />
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: current }}
        onPress={() => setCurrent(!current)}
      >
        <Text>
          {current ? '☑' : '☐'} {t('onboarding.current')}
        </Text>
      </Pressable>
      <ErrorMessage message={error} />
      <Action
        label={t('auth.continue')}
        disabled={!company || !role || !startedOn}
        onPress={() => void save()}
      />
      <Action
        secondary
        label={t('auth.skip')}
        onPress={() => router.push('/onboarding/skills')}
      />
    </AuthScaffold>
  );
}

export function SkillsOnboardingScreen() {
  const { t } = useTranslation();
  const repository = useDependency(dependencyTokens.onboardingRepository);
  const catalogs = useCatalogs();
  const [skills, setSkills] = useState<string[]>([]);
  const [resume, setResume] = useState<{
    name: string;
    mimeType: string;
    size: number;
    uri: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const pick = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/pdf',
      copyToCacheDirectory: true,
    });
    if (!result.canceled) {
      const file = result.assets[0];
      if (file?.size && file.size <= 10 * 1024 * 1024)
        setResume({
          name: file.name,
          mimeType: file.mimeType ?? 'application/pdf',
          size: file.size,
          uri: file.uri,
        });
      else setError(t('auth.error'));
    }
  };
  const finish = async (skipped: boolean) => {
    setLoading(true);
    try {
      if (!skipped) await repository.saveSkills({ skillIds: skills });
      if (resume && !skipped) {
        const blob = await fileBlob(resume.uri, resume.mimeType);
        await repository.uploadResume({
          displayName: resume.name,
          mimeType: 'application/pdf',
          sizeBytes: resume.size,
          bytes: blob,
        });
      }
      await repository.complete(skipped);
      router.replace('/');
    } catch {
      setError(t('auth.error'));
    } finally {
      setLoading(false);
    }
  };
  return (
    <AuthScaffold title={t('onboarding.skillsTitle')}>
      <Text>{t('onboarding.skills')}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {catalogs.data?.skills.map((item) => (
          <Choice
            key={item.id}
            label={item.label}
            selected={skills.includes(item.id)}
            onPress={() =>
              setSkills((current) =>
                current.includes(item.id)
                  ? current.filter((id) => id !== item.id)
                  : current.length < 10
                    ? [...current, item.id]
                    : current,
              )
            }
          />
        ))}
      </View>
      <Action
        secondary
        label={resume?.name ?? t('onboarding.resume')}
        onPress={() => void pick()}
      />
      <ErrorMessage
        message={error ?? (catalogs.isError ? t('auth.error') : null)}
      />
      <Action
        label={t('onboarding.finish')}
        loading={loading}
        onPress={() => void finish(false)}
      />
      <Action
        secondary
        label={t('auth.skip')}
        onPress={() => void finish(true)}
      />
    </AuthScaffold>
  );
}

async function fileBlob(uri: string, mimeType: string) {
  if (Platform.OS === 'web')
    return fetch(uri).then((response) => response.blob());
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const bytes = Uint8Array.from(globalThis.atob(base64), (character) =>
    character.charCodeAt(0),
  );
  return new Blob([bytes], { type: mimeType });
}

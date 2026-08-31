import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { useEffect, useMemo, useState } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  AppText,
  BottomNavigation,
  Button,
  Screen,
  TopAppBar,
  useResponsiveLayout,
  useSnackbar,
} from '@palea/ui-native';
import { PostAuthRouteGuard } from '@/features/auth/presentation/components/PostAuthRouteGuard';
import { useDependency } from '@/core/di/DependenciesProvider';
import { dependencyTokens } from '@/core/di/dependencies';
import type { Resume } from '@palea/contracts';
import type { ResumeUploadFile } from '../../domain/repositories/ResumeRepository';
import { ResumePdfPreview } from '../components/ResumePdfPreview';

const resumesKey = ['resumes', 'ready'];

export function ResumeLibraryScreen() {
  return (
    <PostAuthRouteGuard>
      <ResumeLibraryContent />
    </PostAuthRouteGuard>
  );
}

function ResumeLibraryContent() {
  const repository = useDependency(dependencyTokens.resumeRepository);
  const client = useQueryClient();
  const router = useRouter();
  const { resumeId } = useLocalSearchParams<{ resumeId?: string }>();
  const layout = useResponsiveLayout();
  const { showSnackbar } = useSnackbar();
  const [selected, setSelected] = useState<Resume | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [view, setView] = useState<'grid' | 'list'>(
    layout.isExpanded ? 'grid' : 'list',
  );
  const [renaming, setRenaming] = useState<Resume | null>(null);
  const [displayName, setDisplayName] = useState('');
  const resumes = useQuery({
    queryKey: resumesKey,
    queryFn: () => repository.list(),
  });
  const policy = useQuery({
    queryKey: ['resumes', 'policy'],
    queryFn: () => repository.policy(),
  });
  const invalidate = () =>
    Promise.all([
      client.invalidateQueries({ queryKey: resumesKey }),
      client.invalidateQueries({ queryKey: ['resumes', 'policy'] }),
    ]);
  const download = useMutation({
    mutationFn: (id: string) => repository.createDownload(id),
  });
  const select = async (resume: Resume) => {
    setSelected(resume);
    setPreviewUrl(null);
    try {
      setPreviewUrl(await download.mutateAsync(resume.id));
    } catch {
      showSnackbar({
        variant: 'error',
        message: 'No pudimos cargar el visor.',
      });
    }
  };
  useEffect(() => {
    if (!resumeId || !resumes.data || selected?.id === resumeId) return;
    const resume = resumes.data.find((item) => item.id === resumeId);
    if (resume) void select(resume);
  }, [resumeId, resumes.data, selected?.id]);
  const upload = useMutation({
    mutationFn: (file: ResumeUploadFile) =>
      repository.upload(
        {
          displayName: file.name,
          mimeType: file.mimeType,
          sizeBytes: file.sizeBytes,
        },
        file,
        {
          makePrimary: !(resumes.data?.some((item) => item.isPrimary) ?? false),
        },
      ),
    onSuccess: async () => {
      await invalidate();
      showSnackbar({ variant: 'success', message: 'CV cargado.' });
    },
  });
  const changePrimary = useMutation({
    mutationFn: repository.setPrimary.bind(repository),
    onSuccess: invalidate,
  });
  const rename = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      repository.rename(id, name),
    onSuccess: async () => {
      setRenaming(null);
      await invalidate();
    },
  });
  const remove = useMutation({
    mutationFn: repository.delete.bind(repository),
    onSuccess: async () => {
      if (selected) {
        setSelected(null);
        setPreviewUrl(null);
      }
      await invalidate();
    },
  });
  const chooseFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/pdf',
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets[0]) return;
    try {
      const asset = result.assets[0];
      const bytes = new Uint8Array(
        await (await fetch(asset.uri)).arrayBuffer(),
      );
      if (
        asset.mimeType !== 'application/pdf' ||
        !String.fromCharCode(...bytes.slice(0, 5)).startsWith('%PDF-')
      )
        throw new Error();
      await upload.mutateAsync({
        name: asset.name,
        mimeType: 'application/pdf',
        sizeBytes: asset.size ?? bytes.byteLength,
        readBytes: async () => bytes,
      });
    } catch {
      showSnackbar({
        variant: 'error',
        message: 'Elegí un PDF válido de hasta 10 MiB.',
      });
    }
  };
  const requestDelete = async (resume: Resume) => {
    try {
      const impact = await repository.deleteImpact(resume.id);
      const details = [
        impact.isPrimary ? 'Es tu CV principal.' : '',
        impact.applicationCount
          ? `Se quitará de ${impact.applicationCount} postulaciones.`
          : '',
      ]
        .filter(Boolean)
        .join(' ');
      Alert.alert(
        'Eliminar CV',
        `${details} Esta acción no se puede deshacer.`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Eliminar',
            style: 'destructive',
            onPress: () =>
              void remove.mutateAsync(resume.id).catch(() =>
                showSnackbar({
                  variant: 'error',
                  message: 'No pudimos eliminar el CV.',
                }),
              ),
          },
        ],
      );
    } catch {
      showSnackbar({
        variant: 'error',
        message: 'No pudimos comprobar el impacto.',
      });
    }
  };
  const items = resumes.data ?? [];
  const atLimit = Boolean(
    policy.data && policy.data.usedResumes >= policy.data.maxResumes,
  );
  const collection = useMemo(
    () =>
      items.map((resume) => (
        <ResumeRow
          key={resume.id}
          resume={resume}
          selected={selected?.id === resume.id}
          grid={view === 'grid'}
          onPress={() => void select(resume)}
          onPrimary={() =>
            void changePrimary.mutateAsync(resume.id).then(() => invalidate())
          }
          onRename={() => {
            setRenaming(resume);
            setDisplayName(resume.displayName);
          }}
          onDelete={() => void requestDelete(resume)}
        />
      )),
    [items, selected?.id, view, changePrimary, invalidate],
  );
  return (
    <Screen edges={layout.isExpanded ? ['top', 'bottom'] : ['bottom']}>
      <View className="flex-1 flex-row">
        <View className="flex-1">
          <TopAppBar
            title="Biblioteca de CVs"
            trailing={
              <Button
                label="Subir"
                size="sm"
                loading={upload.isPending}
                disabled={atLimit}
                onPress={() => void chooseFile()}
              />
            }
          />
          <View className="border-b border-border px-4 py-3 dark:border-dark-border">
            <AppText tone="muted">
              {policy.data
                ? `${policy.data.usedResumes} de ${policy.data.maxResumes} CVs · PDF hasta ${Math.round(policy.data.maxSizeBytes / 1024 / 1024)} MiB`
                : 'Cargando límites…'}
            </AppText>
            {atLimit ? (
              <AppText tone="danger">
                Alcanzaste el límite de CVs. Eliminá uno para cargar otro.
              </AppText>
            ) : null}
          </View>
          <View className="flex-row justify-end gap-2 px-4 py-2">
            <Button
              label="Cuadrícula"
              size="sm"
              variant={view === 'grid' ? 'primary' : 'secondary'}
              onPress={() => setView('grid')}
            />
            <Button
              label="Lista"
              size="sm"
              variant={view === 'list' ? 'primary' : 'secondary'}
              onPress={() => setView('list')}
            />
          </View>
          <ScrollView
            contentContainerClassName={`gap-3 px-4 py-3 pb-24 ${view === 'grid' ? 'flex-row flex-wrap' : ''}`}
          >
            {resumes.isLoading ? (
              <AppText>Cargando CVs…</AppText>
            ) : resumes.isError ? (
              <Button
                label="Reintentar"
                onPress={() => void resumes.refetch()}
              />
            ) : items.length ? (
              collection
            ) : (
              <EmptyState onUpload={() => void chooseFile()} />
            )}
          </ScrollView>
          {!layout.isExpanded ? (
            <BottomNavigation
              value="resumes"
              onValueChange={(value) =>
                value === 'applications' ? router.replace('/') : undefined
              }
              items={[
                {
                  value: 'applications',
                  label: 'Postulaciones',
                  icon: 'briefcase',
                },
                { value: 'resumes', label: 'CV', icon: 'fileText' },
              ]}
            />
          ) : null}
        </View>
        {layout.isExpanded ? (
          <View className="w-1/2 border-l border-border dark:border-dark-border">
            <ResumePdfPreview
              url={previewUrl}
              title={selected?.displayName ?? 'Vista previa'}
              onDownload={() => {
                if (previewUrl && Platform.OS === 'web')
                  window.open(previewUrl, '_blank', 'noopener,noreferrer');
              }}
            />
          </View>
        ) : null}
      </View>
      <Modal
        visible={Boolean(renaming)}
        transparent
        animationType="fade"
        onRequestClose={() => setRenaming(null)}
      >
        <View className="flex-1 items-center justify-center bg-overlay px-6">
          <View className="w-full max-w-md gap-4 rounded-lg bg-surface p-5 dark:bg-dark-surface">
            <AppText variant="sectionTitle">Renombrar CV</AppText>
            <TextInput
              value={displayName}
              onChangeText={setDisplayName}
              className="min-h-control-lg rounded-sm border border-border px-3 dark:border-dark-border"
              autoFocus
            />
            <View className="flex-row justify-end gap-2">
              <Button
                label="Cancelar"
                variant="ghost"
                onPress={() => setRenaming(null)}
              />
              <Button
                label="Guardar"
                loading={rename.isPending}
                disabled={!displayName.trim()}
                onPress={() =>
                  renaming &&
                  void rename.mutateAsync({
                    id: renaming.id,
                    name: displayName.trim(),
                  })
                }
              />
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

function ResumeRow({
  resume,
  selected,
  grid,
  onPress,
  onPrimary,
  onRename,
  onDelete,
}: {
  resume: Resume;
  selected: boolean;
  grid: boolean;
  onPress: () => void;
  onPrimary: () => void;
  onRename: () => void;
  onDelete: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      className={`gap-2 rounded-md border p-4 ${selected ? 'border-primary bg-primary-subtle dark:bg-dark-primary-subtle' : 'border-border bg-surface dark:border-dark-border dark:bg-dark-surface'} ${grid ? 'w-56' : 'w-full'}`}
    >
      <View className="flex-row items-center gap-2">
        <AppText className="flex-1" variant="bodySmall" numberOfLines={1}>
          {resume.displayName}
        </AppText>
        {resume.isPrimary ? (
          <AppText tone="interaction">Principal</AppText>
        ) : null}
      </View>
      <AppText tone="muted">{Math.round(resume.sizeBytes / 1024)} KB</AppText>
      <View className="flex-row gap-3">
        <Pressable accessibilityRole="button" onPress={onRename}>
          <AppText tone="interaction">Renombrar</AppText>
        </Pressable>
        {!resume.isPrimary ? (
          <Pressable accessibilityRole="button" onPress={onPrimary}>
            <AppText tone="interaction">Principal</AppText>
          </Pressable>
        ) : null}
        <Pressable accessibilityRole="button" onPress={onDelete}>
          <AppText tone="danger">Eliminar</AppText>
        </Pressable>
      </View>
    </Pressable>
  );
}

function EmptyState({ onUpload }: { onUpload: () => void }) {
  return (
    <View className="items-center gap-3 py-16">
      <AppText variant="sectionTitle">Todavía no tenés CVs</AppText>
      <AppText tone="muted">
        Cargá un PDF para usarlo en tus postulaciones.
      </AppText>
      <Button label="Cargar CV" onPress={onUpload} />
    </View>
  );
}

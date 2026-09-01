import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useSnackbar } from '@palea/ui-native';
import type { Resume } from '@palea/contracts';
import { useLocale } from '@/core/localization/LocaleProvider';
import { useSignOut } from '@/core/session/useSignOut';
import { useResumeLibraryViewModel } from './useResumeLibraryViewModel';
import { useResumePreview } from './useResumePreview';
import type { ResumeDialogState } from '../components/ResumeLibraryDialogs';

export function useResumeLibraryInteractions(expanded: boolean) {
  const vm = useResumeLibraryViewModel();
  const router = useRouter();
  const { t } = useLocale('resumes');
  const { t: appT } = useLocale('applications');
  const { showSnackbar } = useSnackbar();
  const client = useQueryClient();
  const signOut = useSignOut();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<ResumeDialogState | null>(null);
  const [impactChanged, setImpactChanged] = useState(false);
  const selected = vm.resumes.data?.find((item) => item.id === selectedId);
  const dialogResume = vm.resumes.data?.find(
    (item) => item.id === dialog?.resumeId,
  );
  const preview = useResumePreview(expanded && selected ? selected.id : null);
  const impactKey = ['resumes', 'deleteImpact', dialog?.resumeId];
  const impact = useQuery({
    queryKey: impactKey,
    queryFn: () => vm.requestDeleteImpact(dialog!.resumeId),
    enabled: dialog?.kind === 'delete',
    staleTime: 0,
  });
  const remove = useMutation({
    mutationFn: async () => {
      if (!dialogResume || !impact.data)
        throw new Error('resume.missingImpact');
      const fresh = await vm.requestDeleteImpact(dialogResume.id);
      if (
        fresh.applicationCount !== impact.data.applicationCount ||
        fresh.isPrimary !== impact.data.isPrimary
      ) {
        client.setQueryData(impactKey, fresh);
        setImpactChanged(true);
        return false;
      }
      await vm.remove.mutateAsync({
        resumeId: dialogResume.id,
        expectedImpact: {
          applicationCount: fresh.applicationCount,
          isPrimary: fresh.isPrimary,
        },
      });
      return true;
    },
    onSuccess: (deleted) => {
      if (!deleted) return;
      if (selectedId === dialog?.resumeId) setSelectedId(null);
      setDialog(null);
      showSnackbar({ variant: 'success', message: t('deleteSuccess') });
    },
    onError: (error) => {
      if (error.message.includes('resume.impact_changed')) {
        void impact.refetch();
        setImpactChanged(true);
      }
    },
  });
  const open = (resume: Resume) => {
    setDialog(null);
    setSelectedId(resume.id);
    if (!expanded) router.push(`/resumes/${resume.id}`);
  };
  const download = async (id: string) => {
    try {
      await preview.download.mutateAsync(id);
    } catch {
      showSnackbar({ variant: 'error', message: t('downloadError') });
    }
  };
  const action = async (
    kind: 'rename' | 'delete' | 'primary' | 'download' | 'open',
  ) => {
    if (!dialogResume) return;
    if (kind === 'rename' || kind === 'delete') {
      vm.rename.reset();
      remove.reset();
      setImpactChanged(false);
      setDialog({ kind, resumeId: dialogResume.id });
      return;
    }
    const resume = dialogResume;
    setDialog(null);
    if (kind === 'open') return open(resume);
    if (kind === 'download') return download(resume.id);
    try {
      await vm.setPrimary.mutateAsync(resume.id);
      showSnackbar({ variant: 'success', message: t('primarySuccess') });
    } catch {
      showSnackbar({ variant: 'error', message: t('errorMessage') });
    }
  };
  return {
    vm,
    preview,
    selected,
    dialog,
    dialogResume,
    impact,
    impactChanged,
    remove,
    open,
    download,
    action,
    openMenu: (resume: Resume, anchor?: { x: number; y: number }) =>
      setDialog({ kind: 'menu', resumeId: resume.id, anchor }),
    closeDialog: () => setDialog(null),
    closeViewer: () => setSelectedId(null),
    expandViewer: () => {
      if (selected) router.push(`/resumes/${selected.id}`);
    },
    rename: async (name: string) => {
      if (!dialogResume) return;
      try {
        await vm.rename.mutateAsync({ id: dialogResume.id, name });
        setDialog(null);
        showSnackbar({ variant: 'success', message: t('renameSuccess') });
      } catch {
        /* Inline mutation error keeps the draft available for retry. */
      }
    },
    upload: async () => {
      try {
        if (await vm.chooseFile())
          showSnackbar({ variant: 'success', message: t('uploadSuccess') });
      } catch {
        showSnackbar({ variant: 'error', message: t('uploadError') });
      }
    },
    addApplication: () => router.push('/applications/new'),
    navigate: (destination: string) => {
      if (destination === 'applications') router.push('/');
      else if (destination !== 'resumes')
        showSnackbar({ variant: 'info', message: appT('nav.pending') });
    },
    signingOut: signOut.isPending,
    signOut: async () => {
      try {
        await signOut.mutateAsync();
        router.replace('/auth/login');
      } catch {
        showSnackbar({ variant: 'error', message: appT('nav.logoutError') });
      }
    },
  };
}

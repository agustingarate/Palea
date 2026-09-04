import { Linking } from 'react-native';
import { useState } from 'react';
import { useResumeFilePicker } from '@/features/resumes/presentation/viewmodels/useResumeFilePicker';
import type { ApplicationStatus } from '@palea/contracts';
import { useRouter } from 'expo-router';
import { useLocale } from '@/core/localization/LocaleProvider';
import { useSnackbar } from '@palea/ui-native';
import type { ResumeUploadFile } from '@/features/resumes/domain/repositories/ResumeRepository';
import type { ApplicationDetail } from '../../domain/entities/Application';
import { todayLocal } from '../create/applicationCreateModel';
import { navigateToApplicationsHome } from '../navigation/applicationsHomeNavigation';

export const applicationStatuses: ApplicationStatus[] = [
  'draft',
  'applied',
  'interview',
  'offer',
  'rejected',
];

type DetailMutations = {
  updateStatus: (
    input: [string, ApplicationStatus, number | undefined, string | undefined],
  ) => Promise<unknown>;
  updateResume: (resumeId: string | null) => Promise<unknown>;
  uploadResume: (file: ResumeUploadFile) => Promise<unknown>;
  createDownload: (resumeId: string) => Promise<string>;
  removeApplication: () => Promise<unknown>;
};

export function useApplicationDetailInteractions({
  applicationId,
  application,
  mutations,
}: {
  applicationId: string;
  application: ApplicationDetail;
  mutations: DetailMutations;
}) {
  const router = useRouter();
  const picker = useResumeFilePicker();
  const { t } = useLocale('applications');
  const { showSnackbar } = useSnackbar();
  const [statusOpen, setStatusOpen] = useState(false);
  const [resumeOpen, setResumeOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<ApplicationStatus | null>(
    null,
  );
  const [moveDate, setMoveDate] = useState<string | null>(todayLocal());
  const [deleteOpen, setDeleteOpen] = useState(false);

  const commitStatus = async (
    status: ApplicationStatus,
    appliedOn?: string,
  ) => {
    try {
      await mutations.updateStatus([
        applicationId,
        status,
        undefined,
        appliedOn,
      ]);
      showSnackbar({ variant: 'success', message: t('feedback.moved') });
    } catch {
      showSnackbar({ variant: 'error', message: t('error.move') });
    }
  };

  const selectStatus = (status: ApplicationStatus) => {
    setStatusOpen(false);
    if (
      application.status === 'draft' &&
      status !== 'draft' &&
      !application.appliedOn
    ) {
      setMoveDate(todayLocal());
      setPendingStatus(status);
      return;
    }
    void commitStatus(status);
  };

  const confirmStatusDate = () => {
    if (!pendingStatus || !moveDate) return;
    const requestedStatus = pendingStatus;
    setPendingStatus(null);
    void commitStatus(requestedStatus, moveDate);
  };

  const downloadResume = async () => {
    if (!application.resume) return;
    try {
      const url = await mutations.createDownload(application.resume.id);
      await Linking.openURL(url);
    } catch {
      showSnackbar({ variant: 'error', message: t('detail.downloadError') });
    }
  };

  const uploadResume = async () => {
    try {
      const file = await picker.selection.mutateAsync();
      if (!file) return;
      await mutations.uploadResume(file);
      setResumeOpen(false);
      showSnackbar({ variant: 'success', message: t('detail.resumeUpdated') });
    } catch {
      showSnackbar({ variant: 'error', message: t('create.uploadError') });
    }
  };

  const selectResume = async (resumeId: string | null) => {
    try {
      await mutations.updateResume(resumeId);
      setResumeOpen(false);
      showSnackbar({ variant: 'success', message: t('detail.resumeUpdated') });
    } catch {
      showSnackbar({ variant: 'error', message: t('detail.resumeError') });
    }
  };

  const openResource = (url: string) => {
    void Linking.openURL(url).catch(() =>
      showSnackbar({ variant: 'error', message: t('detail.resourceError') }),
    );
  };

  const removeApplication = async () => {
    try {
      await mutations.removeApplication();
      setDeleteOpen(false);
      showSnackbar({ variant: 'success', message: t('feedback.deleted') });
      navigateToApplicationsHome(router);
    } catch {
      showSnackbar({ variant: 'error', message: t('error.delete') });
    }
  };

  return {
    statusOpen,
    setStatusOpen,
    resumeOpen,
    setResumeOpen,
    pendingStatus,
    setPendingStatus,
    moveDate,
    setMoveDate,
    deleteOpen,
    setDeleteOpen,
    selectStatus,
    confirmStatusDate,
    downloadResume,
    uploadResume,
    selectResume,
    openResource,
    removeApplication,
  };
}

export type { DetailMutations };

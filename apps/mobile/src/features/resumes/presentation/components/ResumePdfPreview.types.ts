export interface ResumePdfPreviewProps {
  url: string | null;
  title: string;
  loading?: boolean;
  error?: boolean;
  downloadPending?: boolean;
  onDownload: () => void;
  onRetry: () => void;
  onAccessError?: () => void;
  onClose?: () => void;
  onExpand?: () => void;
}

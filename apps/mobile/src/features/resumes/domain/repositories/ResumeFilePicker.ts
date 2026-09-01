export interface PickedResumeFile {
  name: string;
  mimeType?: string;
  sizeBytes?: number;
  readBytes(): Promise<Uint8Array>;
}

export interface ResumeFilePicker {
  pick(): Promise<PickedResumeFile | null>;
}

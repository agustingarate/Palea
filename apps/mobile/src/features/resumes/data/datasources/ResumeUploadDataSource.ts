export interface ResumeUploadDataSource {
  put(
    url: string,
    bytes: ArrayBuffer,
    mimeType: string,
    onProgress?: (value: number) => void,
  ): Promise<void>;
}

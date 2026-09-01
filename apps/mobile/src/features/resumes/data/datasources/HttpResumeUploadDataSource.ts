import type { ResumeUploadDataSource } from './ResumeUploadDataSource';

export class HttpResumeUploadDataSource implements ResumeUploadDataSource {
  put(
    url: string,
    bytes: ArrayBuffer,
    mimeType: string,
    onProgress?: (value: number) => void,
  ) {
    return putWithProgress(url, bytes, mimeType, onProgress);
  }
}

function putWithProgress(
  url: string,
  body: ArrayBuffer,
  mimeType: string,
  onProgress?: (progress: number) => void,
) {
  return new Promise<void>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open('PUT', url);
    request.setRequestHeader('content-type', mimeType);
    request.timeout = 30_000;
    request.upload.onprogress = (event) => {
      if (event.lengthComputable)
        onProgress?.(Math.round((event.loaded / event.total) * 95));
    };
    request.onload = () =>
      request.status >= 200 && request.status < 300
        ? resolve()
        : reject(new Error('resume.uploadFailed'));
    request.onerror = request.ontimeout = () =>
      reject(new Error('resume.uploadFailed'));
    request.send(body);
  });
}

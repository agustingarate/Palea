export type AppErrorCode = 'cancelled' | 'network' | 'invalid-data' | 'unknown';

export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: AppErrorCode,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = 'AppError';
  }
}

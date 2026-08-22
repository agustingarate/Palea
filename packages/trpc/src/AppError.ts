import { TRPCError, type TRPC_ERROR_CODE_KEY } from '@trpc/server';
import type { AppErrorCode } from '@palea/contracts';

/** Deliberate errors cross the API boundary as a stable code, never raw internals. */
export class AppError extends TRPCError {
  constructor(
    readonly appCode: AppErrorCode,
    code: TRPC_ERROR_CODE_KEY = 'BAD_REQUEST',
  ) {
    super({ code, message: 'Request could not be completed.' });
  }
}

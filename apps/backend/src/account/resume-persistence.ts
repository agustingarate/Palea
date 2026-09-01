import type { Prisma } from '@prisma/client';

/** Shared by CV mutations and association changes, including application creation. */
export async function lockResumeLibrary(
  tx: Prisma.TransactionClient,
  subject: string,
) {
  await tx.$queryRaw`select id from public.profiles where id = ${subject}::uuid for update`;
}

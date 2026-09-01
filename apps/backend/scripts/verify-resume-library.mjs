import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';
import { ResumeService } from '../dist/src/account/resume.service.js';
import { ResumePdfValidator } from '../dist/src/account/resume-pdf.validator.js';

// Never point destructive test-fixture cleanup at a shared or remote database.
const database = new URL(process.env.DATABASE_URL);
assert(
  ['localhost', '127.0.0.1'].includes(database.hostname) &&
    database.port === '54322',
  'Local Supabase required',
);
const prisma = new PrismaClient();
const owner = randomUUID();
const foreignOwner = randomUUID();
const pdf = new Uint8Array(
  readFileSync(new URL('../test/fixtures/resume-valid.pdf', import.meta.url)),
);
const service = new ResumeService(prisma, new ResumePdfValidator());
let signingFails = false;
service.storage = {
  storage: {
    from: () => ({
      createSignedUploadUrl: async () =>
        signingFails
          ? { error: true }
          : {
              data: { signedUrl: 'https://example.invalid/synthetic-upload' },
              error: null,
            },
      download: async () => ({ data: new Blob([pdf]), error: null }),
    }),
  },
};
const reserve = () =>
  service.reserve(owner, {
    displayName: 'Synthetic QA.pdf',
    mimeType: 'application/pdf',
    sizeBytes: pdf.length,
  });

try {
  await prisma.$executeRaw`insert into auth.users(id) values (${owner}::uuid), (${foreignOwner}::uuid)`;
  const policy = await service.policy(owner);
  assert.equal(policy.maxResumes, 10);
  assert.equal(policy.maxSizeBytes, 10485760);
  const initial = [];
  for (let index = 0; index < 9; index += 1) {
    initial.push(
      await prisma.resume.create({
        data: {
          profileId: owner,
          storagePath: `${owner}/${randomUUID()}.pdf`,
          displayName: 'Synthetic.pdf',
          mimeType: 'application/pdf',
          sizeBytes: BigInt(pdf.length),
          uploadStatus: 'ready',
          uploadedAt: new Date(),
          createdAt: new Date(Date.now() - 86_400_000),
          isPrimary: index === 0,
        },
      }),
    );
  }
  const simultaneous = await Promise.allSettled([reserve(), reserve()]);
  assert.equal(
    simultaneous.filter((result) => result.status === 'fulfilled').length,
    1,
  );
  assert.equal((await service.policy(owner)).usedResumes, 10);
  const accepted = simultaneous.find(
    (result) => result.status === 'fulfilled',
  ).value;
  await service.cancel(owner, accepted.resumeId);
  await service.cancel(owner, accepted.resumeId);
  assert.equal((await service.policy(owner)).usedResumes, 9);
  signingFails = true;
  await assert.rejects(reserve);
  signingFails = false;
  assert.equal((await service.policy(owner)).usedResumes, 9);

  const upload = await reserve();
  await Promise.all([
    service.confirm(owner, upload.resumeId, 'if_missing'),
    service.confirm(owner, upload.resumeId, 'if_missing'),
  ]);
  assert.equal(
    (await prisma.resume.findUniqueOrThrow({ where: { id: initial[0].id } }))
      .isPrimary,
    true,
  );
  await Promise.all([
    service.setPrimary(owner, initial[1].id),
    service.setPrimary(owner, upload.resumeId),
  ]);
  assert.equal(
    await prisma.resume.count({ where: { profileId: owner, isPrimary: true } }),
    1,
  );
  await assert.rejects(() =>
    service.rename(foreignOwner, upload.resumeId, 'Forbidden'),
  );
  await assert.rejects(() =>
    service.createPreview(foreignOwner, upload.resumeId),
  );
  await assert.rejects(() => service.cancel(foreignOwner, accepted.resumeId));

  const application = await prisma.application.create({
    data: {
      profileId: owner,
      companyName: 'Synthetic QA',
      role: 'Test',
      resumeId: upload.resumeId,
      status: 'draft',
    },
  });
  await service.setPrimary(owner, upload.resumeId);
  await assert.rejects(
    () =>
      service.remove(owner, {
        resumeId: upload.resumeId,
        expectedImpact: { isPrimary: true, applicationCount: 0 },
      }),
    { code: 'CONFLICT' },
  );
  const impact = await service.deleteImpact(owner, upload.resumeId);
  await service.remove(owner, {
    resumeId: upload.resumeId,
    expectedImpact: impact,
  });
  assert.equal(
    (
      await prisma.application.findUniqueOrThrow({
        where: { id: application.id },
      })
    ).resumeId,
    null,
  );
  assert.equal(
    await prisma.resume.count({ where: { profileId: owner, isPrimary: true } }),
    0,
  );
  assert(
    await prisma.resumeCleanupJob.findUnique({
      where: { storagePath: upload.path },
    }),
  );

  const expired = await reserve();
  await prisma.resume.update({
    where: { id: expired.resumeId },
    data: { uploadExpiresAt: new Date(Date.now() - 1000) },
  });
  assert.equal((await service.policy(owner)).usedResumes, 9);
  await assert.rejects(
    () => service.confirm(owner, expired.resumeId, 'preserve'),
    { code: 'BAD_REQUEST' },
  );
  assert(
    await prisma.resumeCleanupJob.findUnique({
      where: { storagePath: expired.path },
    }),
  );

  await assert.rejects(
    () =>
      service.reserve(owner, {
        displayName: 'large.pdf',
        mimeType: 'application/pdf',
        sizeBytes: policy.maxSizeBytes + 1,
      }),
    { code: 'BAD_REQUEST' },
  );
  const exact = await service.reserve(owner, {
    displayName: 'exact.pdf',
    mimeType: 'application/pdf',
    sizeBytes: policy.maxSizeBytes,
  });
  await service.cancel(owner, exact.resumeId);
  const bucket =
    await prisma.$queryRaw`select public, file_size_limit from storage.buckets where id = 'resumes'`;
  assert.equal(bucket[0].public, false);
  assert.equal(Number(bucket[0].file_size_limit), policy.maxSizeBytes);
  await assert.rejects(() =>
    prisma.$transaction(async (tx) => {
      await tx.$executeRaw`set local role authenticated`;
      await tx.resumeLibraryPolicy.findMany();
    }),
  );
  await assert.rejects(() =>
    prisma.$transaction(async (tx) => {
      await tx.$executeRaw`set local role authenticated`;
      await tx.resumeCleanupJob.findMany();
    }),
  );
  await assert.rejects(() =>
    prisma.$transaction(async (tx) => {
      await tx.resumeLibraryPolicy.update({
        where: { id: 'global' },
        data: { maxSizeBytes: 100n },
      });
      const changed =
        await tx.$queryRaw`select file_size_limit from storage.buckets where id = 'resumes'`;
      assert.equal(Number(changed[0].file_size_limit), 100);
      await tx.resume.create({
        data: {
          profileId: owner,
          storagePath: `${owner}/too-large.pdf`,
          displayName: 'large.pdf',
          mimeType: 'application/pdf',
          sizeBytes: 101n,
          uploadStatus: 'pending',
          uploadExpiresAt: new Date(Date.now() + 60000),
        },
      });
    }),
  );
  assert.equal((await service.policy(owner)).maxSizeBytes, 10485760);
  console.log(
    'PASS: concurrent quota, cancellation, signing failure, duplicate confirmation, unique primary, ownership, deletion impact, unlinking, durable cleanup, expiry and exact size policy.',
  );
} finally {
  await prisma.$executeRaw`delete from auth.users where id in (${owner}::uuid, ${foreignOwner}::uuid)`;
  // These jobs reference synthetic DB-only fixtures, never real Storage objects.
  await prisma.resumeCleanupJob.deleteMany({
    where: { storagePath: { startsWith: `${owner}/` } },
  });
  await prisma.$disconnect();
}

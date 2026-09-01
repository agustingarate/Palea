import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createApp } from '../src/create-app';
import { ResumeCleanupService } from '../src/account/resume-cleanup.service';

describe('Palea backend', () => {
  let app: INestApplication;
  beforeAll(async () => {
    // HTTP smoke tests do not own a database. Worker persistence is verified
    // separately against local Supabase by verify-resume-library.mjs.
    jest
      .spyOn(ResumeCleanupService.prototype, 'onModuleInit')
      .mockImplementation(() => undefined);
    app = await createApp();
    await app.init();
  });
  afterAll(async () => {
    await app.close();
    jest.restoreAllMocks();
  });

  it('serves REST health', async () => {
    await request(app.getHttpServer())
      .get('/health')
      .expect(200, { status: 'ok' });
  });

  it('serves REST projects for the Axios adapter', async () => {
    const response = await request(app.getHttpServer())
      .get('/projects')
      .expect(200);
    expect(response.body).toHaveLength(2);
  });

  it('mounts tRPC system health over HTTP', async () => {
    const response = await request(app.getHttpServer())
      .get('/trpc/system.health')
      .query({ input: '{}' })
      .expect(200);
    expect(response.body.result.data).toEqual({ status: 'ok' });
  });
});

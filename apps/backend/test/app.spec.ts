import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createApp } from '../src/create-app';

describe('Palea backend', () => {
  let app: INestApplication;
  beforeAll(async () => {
    app = await createApp();
    await app.init();
  });
  afterAll(async () => app.close());

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

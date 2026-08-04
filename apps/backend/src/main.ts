import 'reflect-metadata';
import { environment } from './config/environment';
import { createApp } from './create-app';

async function bootstrap(): Promise<void> {
  const app = await createApp();
  await app.listen(environment.port);
}

void bootstrap();

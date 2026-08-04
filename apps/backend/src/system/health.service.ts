import { Injectable } from '@nestjs/common';
import type { Health } from '@palea/contracts';

@Injectable()
export class HealthService {
  async get(): Promise<Health> {
    return { status: 'ok' };
  }
}

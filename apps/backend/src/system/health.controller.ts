import { Controller, Get, Inject } from '@nestjs/common';
import type { Health } from '@palea/contracts';
import { HealthService } from './health.service';

@Controller('health')
export class HealthController {
  constructor(@Inject(HealthService) private readonly health: HealthService) {}
  @Get()
  get(): Promise<Health> {
    return this.health.get();
  }
}

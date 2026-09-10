import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import type { HealthCheckService } from '@nestjs/terminus';
import { HealthCheck } from '@nestjs/terminus';

import { Public } from '../common/decorators/public.decorator';

import type { PrismaHealthIndicator } from './health.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private dbHealth: PrismaHealthIndicator,
  ) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Basic liveness check' })
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'pc-platform-api',
    };
  }

  @Public()
  @Get('db')
  @HealthCheck()
  @ApiOperation({ summary: 'Database readiness check' })
  checkDatabase() {
    return this.health.check([() => this.dbHealth.isHealthy('database')]);
  }
}

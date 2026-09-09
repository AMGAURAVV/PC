import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';
import { PrismaHealthIndicator } from './health.service';
import { Public } from '../common/decorators/public.decorator';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

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

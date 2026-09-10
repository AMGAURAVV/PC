import { HealthCheckService } from '@nestjs/terminus';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';

import { HealthController } from './health.controller';
import { PrismaHealthIndicator } from './health.service';

describe('HealthController', () => {
  let controller: HealthController;
  let healthCheckService: jest.Mocked<HealthCheckService>;
  let dbHealthIndicator: jest.Mocked<PrismaHealthIndicator>;

  beforeEach(async () => {
    const mockHealthService = {
      check: jest.fn(),
    };

    const mockDbHealth = {
      isHealthy: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: HealthCheckService, useValue: mockHealthService },
        { provide: PrismaHealthIndicator, useValue: mockDbHealth },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    healthCheckService = module.get(HealthCheckService);
    dbHealthIndicator = module.get(PrismaHealthIndicator);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('check (GET /health)', () => {
    it('should return ok status and service name', () => {
      const result = controller.check();

      expect(result).toBeDefined();
      expect(result.status).toBe('ok');
      expect(result.service).toBe('pc-platform-api');
      expect(result.timestamp).toBeDefined();
    });
  });

  describe('checkDatabase (GET /health/db)', () => {
    it('should delegate to HealthCheckService and return check result', async () => {
      const mockResult: any = {
        status: 'ok',
        info: { database: { status: 'up' } },
        error: {},
        details: { database: { status: 'up' } },
      };

      healthCheckService.check.mockImplementation(async (indicators: any) => {
        await Promise.all(indicators.map((fn: any) => fn()));
        return mockResult;
      });
      dbHealthIndicator.isHealthy.mockResolvedValue({
        database: { status: 'up' },
      });

      const result = await controller.checkDatabase();

      expect(result).toEqual(mockResult);
      expect(healthCheckService.check).toHaveBeenCalled();
      expect(dbHealthIndicator.isHealthy).toHaveBeenCalledWith('database');
    });
  });
});

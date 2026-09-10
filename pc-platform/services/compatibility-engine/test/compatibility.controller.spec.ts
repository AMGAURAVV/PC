import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';

import { CompatibilityController } from '../src/compatibility/compatibility.controller';
import { CompatibilityService } from '../src/compatibility/compatibility.service';

import { highEndAmdCompatibleBuild, socketMismatchBuild } from './fixtures';

describe('CompatibilityController Unit Tests', () => {
  let controller: CompatibilityController;
  let service: CompatibilityService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CompatibilityController],
      providers: [CompatibilityService],
    }).compile();

    controller = module.get<CompatibilityController>(CompatibilityController);
    service = module.get<CompatibilityService>(CompatibilityService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
  });

  it('POST /check should forward build components to CompatibilityService and return compatible report', () => {
    const result = controller.check(highEndAmdCompatibleBuild);
    expect(result.status).toBe('compatible');
    expect(result.compatible).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it('POST /check should forward incompatible build and return structured errors', () => {
    const result = controller.check(socketMismatchBuild);
    expect(result.status).toBe('incompatible');
    expect(result.compatible).toBe(false);
    expect(result.issues.length).toBeGreaterThan(0);
    expect(result.issues[0].ruleId).toBe('cpu-socket');
  });
});

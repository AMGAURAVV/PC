import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { DatabaseService } from '@pc-platform/database';

import { ConfiguratorController } from './configurator.controller';
import { ConfiguratorService } from './configurator.service';

describe('ConfiguratorController', () => {
  let controller: ConfiguratorController;
  let service: ConfiguratorService;

  const mockDb = {
    product: {
      findMany: jest.fn().mockResolvedValue([]),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConfiguratorController],
      providers: [
        ConfiguratorService,
        { provide: DatabaseService, useValue: mockDb },
      ],
    }).compile();

    controller = module.get<ConfiguratorController>(ConfiguratorController);
    service = module.get<ConfiguratorService>(ConfiguratorService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return all 6 use cases', () => {
    const res = controller.getUseCases();
    expect(res.data).toHaveLength(6);
    expect(res.data.map((u) => u.id)).toContain('gaming');
    expect(res.data.map((u) => u.id)).toContain('creator');
    expect(res.data.map((u) => u.id)).toContain('streaming');
    expect(res.data.map((u) => u.id)).toContain('productivity');
    expect(res.data.map((u) => u.id)).toContain('workstation');
    expect(res.data.map((u) => u.id)).toContain('budget');
  });

  it('should filter base builds by use case and budget', () => {
    const res = controller.getBaseBuilds({ useCase: 'gaming' });
    expect(res.data.length).toBeGreaterThan(0);
    expect(res.data.every((b) => b.useCase === 'gaming')).toBe(true);

    const budgetRes = controller.getBaseBuilds({ budgetMax: 70000 });
    expect(budgetRes.data.length).toBeGreaterThan(0);
    expect(budgetRes.data.every((b) => b.basePrice <= 70000)).toBe(true);
  });

  it('should retrieve base build by id', () => {
    const res = controller.getBaseBuildById('gaming-1080p-esports');
    expect(res.data).toBeDefined();
    expect(res.data.name).toContain('Apex Esports');
  });

  it('should retrieve options for a base build with 10 slots and educational benefits', async () => {
    const res = await controller.getBaseBuildOptions('gaming-1440p-enthusiast');
    expect(res.data).toBeDefined();
    expect(res.data.baseBuild.id).toBe('gaming-1440p-enthusiast');

    const slots = [
      'cpu',
      'gpu',
      'ram',
      'storage',
      'cooling',
      'case',
      'psu',
      'os',
      'accessories',
      'warranty',
    ];

    for (const slot of slots) {
      const options = (res.data.optionsBySlot as Record<string, any>)[slot];
      expect(options).toBeDefined();
      expect(options.length).toBeGreaterThan(0);
      expect(options.some((o: any) => o.isDefault)).toBe(true);
      expect(options[0].whyItMatters).toBeDefined();
      expect(options[0].compatibilityStatus).toBe('compatible');
    }
  });
});

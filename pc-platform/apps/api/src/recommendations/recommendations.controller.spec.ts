import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import type { RecommendationResult } from '@pc-platform/types';

import type { RecommendationRequestDto } from './dto/recommendation-request.dto';
import { RecommendationsController } from './recommendations.controller';
import { RecommendationsService } from './recommendations.service';

describe('RecommendationsController', () => {
  let controller: RecommendationsController;
  let service: RecommendationsService;

  const mockResult: RecommendationResult = {
    recommendedComponents: {
      cpu: {
        slot: 'cpu',
        productId: 'cpu-1',
        name: 'AMD Ryzen 5 7600',
        brand: 'AMD',
        price: 18000,
        specs: {},
        reason: 'Optimal performance',
      },
    },
    alternativeComponents: {},
    estimatedCost: 85000,
    compatibilityScore: 100,
    performanceScore: 88,
    valueScore: 92,
    upgradeScore: 90,
    scoringBreakdown: {
      performance: 88,
      priceEfficiency: 92,
      compatibility: 100,
      availability: 95,
      powerEfficiency: 85,
      upgradeability: 90,
      userPreferences: 90,
      overallScore: 91,
    },
    rationale: 'Balanced 1440p gaming build',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RecommendationsController],
      providers: [
        {
          provide: RecommendationsService,
          useValue: {
            generateRecommendation: jest.fn().mockResolvedValue(mockResult),
          },
        },
      ],
    }).compile();

    controller = module.get<RecommendationsController>(RecommendationsController);
    service = module.get<RecommendationsService>(RecommendationsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should generate recommendations and return wrapped api response', async () => {
    const dto: RecommendationRequestDto = {
      budget: 100000,
      useCase: 'gaming',
      resolution: '1440p',
      targetFps: 120,
    };

    const response = await controller.getRecommendation(dto);

    expect(response.success).toBe(true);
    expect(response.data).toEqual(mockResult);
    expect(service.generateRecommendation).toHaveBeenCalledWith(dto);
  });
});

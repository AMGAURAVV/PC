import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';

import { SearchController } from './search.controller';
import { SearchService } from './search.service';

describe('SearchController', () => {
  let controller: SearchController;
  let mockSearchService: any;

  beforeEach(async () => {
    mockSearchService = {
      search: jest.fn().mockResolvedValue({
        items: [],
        total: 0,
        page: 1,
        limit: 12,
        totalPages: 1,
        facets: {
          categories: [],
          brands: [],
          componentTypes: [],
          priceRange: { min: 0, max: 0 },
          inStockCount: 0,
        },
      }),
      suggest: jest.fn().mockResolvedValue([
        { title: 'Intel Core i9', type: 'product' },
      ]),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SearchController],
      providers: [
        {
          provide: SearchService,
          useValue: mockSearchService,
        },
      ],
    }).compile();

    controller = module.get<SearchController>(SearchController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call searchService.search on GET /search and return ApiResponse.ok', async () => {
    const res = await controller.search({ q: 'Core i9', page: 1, limit: 10 });
    expect(mockSearchService.search).toHaveBeenCalledWith({
      q: 'Core i9',
      page: 1,
      limit: 10,
    });
    expect(res.success).toBe(true);
    expect(res.data.items).toEqual([]);
  });

  it('should call searchService.suggest on GET /search/suggest and return ApiResponse.ok', async () => {
    const res = await controller.suggest({ q: 'Intel', limit: 5 });
    expect(mockSearchService.suggest).toHaveBeenCalledWith({
      q: 'Intel',
      limit: 5,
    });
    expect(res.success).toBe(true);
    expect(res.data).toHaveLength(1);
    expect(res.data[0]?.title).toBe('Intel Core i9');
  });
});

import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';

import { CacheService } from '../common/cache/cache.service';

import type {
  SearchProvider,
  SearchResult,
  SearchSuggestion} from './interfaces/search-provider.interface';
import {
  SEARCH_PROVIDER_TOKEN
} from './interfaces/search-provider.interface';
import { SearchService } from './search.service';


describe('SearchService', () => {
  let service: SearchService;
  let mockProvider: jest.Mocked<SearchProvider>;
  let mockCacheService: any;

  const mockSearchResult: SearchResult = {
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
  };

  const mockSuggestions: SearchSuggestion[] = [
    { title: 'RTX 4080', type: 'product', slug: 'rtx-4080' },
  ];

  beforeEach(async () => {
    mockProvider = {
      search: jest.fn().mockResolvedValue(mockSearchResult),
      suggest: jest.fn().mockResolvedValue(mockSuggestions),
    };

    mockCacheService = {
      wrap: jest.fn().mockImplementation((_key, fn) => fn()),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        {
          provide: SEARCH_PROVIDER_TOKEN,
          useValue: mockProvider,
        },
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
      ],
    }).compile();

    service = module.get<SearchService>(SearchService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('search()', () => {
    it('should delegate search to SearchProvider and wrap with cache', async () => {
      const result = await service.search({
        q: 'RTX',
        page: 1,
        limit: 12,
        sortBy: 'relevance',
      });

      expect(mockCacheService.wrap).toHaveBeenCalled();
      expect(mockProvider.search).toHaveBeenCalledWith({
        query: 'RTX',
        categorySlugs: undefined,
        brandSlugs: undefined,
        componentTypes: undefined,
        minPrice: undefined,
        maxPrice: undefined,
        inStock: undefined,
        sortBy: 'relevance',
        page: 1,
        limit: 12,
        specs: undefined,
      });
      expect(result).toBe(mockSearchResult);
    });
  });

  describe('suggest()', () => {
    it('should delegate suggest to SearchProvider and wrap with cache', async () => {
      const result = await service.suggest({ q: 'RTX', limit: 5 });

      expect(mockCacheService.wrap).toHaveBeenCalled();
      expect(mockProvider.suggest).toHaveBeenCalledWith('RTX', 5);
      expect(result).toBe(mockSuggestions);
    });
  });
});

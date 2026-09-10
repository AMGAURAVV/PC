import { Inject, Injectable } from '@nestjs/common';

import type { CacheService } from '../common/cache/cache.service';

import type { SearchQueryDto, SuggestQueryDto } from './dto/search.dto';
import type {
  SearchProvider,
  SearchResult,
  SearchSuggestion,
  SearchOptions} from './interfaces/search-provider.interface';
import {
  SEARCH_PROVIDER_TOKEN
} from './interfaces/search-provider.interface';


@Injectable()
export class SearchService {
  constructor(
    @Inject(SEARCH_PROVIDER_TOKEN)
    private readonly searchProvider: SearchProvider,
    private readonly cacheService: CacheService,
  ) {}

  /**
   * Search catalog products with multi-field matching, facet calculation,
   * sorting, and pagination.
   */
  async search(dto: SearchQueryDto): Promise<SearchResult> {
    const cacheKey = `catalog:search:${JSON.stringify(dto)}`;

    return this.cacheService.wrap(
      cacheKey,
      async () => {
        const options: SearchOptions = {
          query: dto.q,
          categorySlugs: dto.category,
          brandSlugs: dto.brand,
          componentTypes: dto.componentType,
          minPrice: dto.minPrice,
          maxPrice: dto.maxPrice,
          inStock: dto.inStock,
          sortBy: dto.sortBy,
          page: dto.page,
          limit: dto.limit,
          specs: dto.specs,
        };

        return this.searchProvider.search(options);
      },
      60,
      ['catalog:search', 'catalog:products'],
    );
  }

  /**
   * Autocomplete & search suggestions for quick dropdown lookup.
   */
  async suggest(dto: SuggestQueryDto): Promise<SearchSuggestion[]> {
    const cacheKey = `catalog:search:suggest:${dto.q.trim().toLowerCase()}:${dto.limit ?? 8}`;

    return this.cacheService.wrap(
      cacheKey,
      async () => {
        return this.searchProvider.suggest(dto.q, dto.limit);
      },
      120,
      ['catalog:search'],
    );
  }
}

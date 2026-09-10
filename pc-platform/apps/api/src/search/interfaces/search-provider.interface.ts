import type { ProductResponseDto } from '../../products/dto/product.dto';

export const SEARCH_PROVIDER_TOKEN = 'SEARCH_PROVIDER_TOKEN';

export interface FacetBucket {
  value: string;
  label: string;
  count: number;
}

export interface SearchFacets {
  categories: FacetBucket[];
  brands: FacetBucket[];
  componentTypes: FacetBucket[];
  priceRange: { min: number; max: number };
  inStockCount: number;
  specifications?: Record<string, FacetBucket[]> | undefined;
}

export interface SearchOptions {
  query?: string | undefined;
  categorySlugs?: string[] | undefined;
  brandSlugs?: string[] | undefined;
  componentTypes?: string[] | undefined;
  minPrice?: number | undefined;
  maxPrice?: number | undefined;
  inStock?: boolean | undefined;
  sortBy?: ('relevance' | 'price_asc' | 'price_desc' | 'newest' | 'name_asc' | 'name_desc') | undefined;
  page?: number | undefined;
  limit?: number | undefined;
  specs?: Record<string, any> | undefined;
}

export interface SearchResult {
  items: ProductResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  facets: SearchFacets;
}

export interface SearchSuggestion {
  id?: string | undefined;
  title: string;
  type: 'product' | 'brand' | 'category' | 'spec' | 'query';
  slug?: string | undefined;
  category?: string | undefined;
  price?: number | undefined;
}

/**
 * Pluggable SearchProvider contract.
 *
 * All search providers (Postgres, Elasticsearch, OpenSearch, Typesense)
 * must implement this interface. Swapping engines only requires registering
 * a different provider with SEARCH_PROVIDER_TOKEN in SearchModule.
 */
export interface SearchProvider {
  /**
   * Perform multi-field search across name, brand, model, category, and specifications
   * with filtering, faceted aggregation, sorting, and pagination.
   */
  search(options: SearchOptions): Promise<SearchResult>;

  /**
   * Generate instant autocomplete & search suggestions for dropdowns.
   */
  suggest(query: string, limit?: number): Promise<SearchSuggestion[]>;
}

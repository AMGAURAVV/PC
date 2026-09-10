import { useQuery } from '@tanstack/react-query';
import { searchProducts, getSearchSuggestions } from '../lib/api/client';
import type { SearchFilterInput } from '@pc-platform/types';

export function useSearch(filters: SearchFilterInput = {}) {
  return useQuery({
    queryKey: ['search', filters],
    queryFn: () => searchProducts(filters),
    staleTime: 1000 * 60, // 1 minute
  });
}

export function useSearchSuggestions(query: string, limit: number = 8) {
  const trimmed = query.trim();
  return useQuery({
    queryKey: ['search-suggestions', trimmed, limit],
    queryFn: () => getSearchSuggestions(trimmed, limit),
    enabled: trimmed.length >= 2,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

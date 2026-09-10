import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { productsService } from '../services/products.service';
import type { Product, PaginatedResponse, ApiResponse } from '@pc-platform/types';
import type { ProductFilters } from '@pc-platform/validation';

export function useProducts(
  filters?: Partial<ProductFilters>,
  options?: { initialData?: PaginatedResponse<Product> },
) {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: () => productsService.getProducts(filters),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 15, // 15 minutes cache retention
    ...(options?.initialData ? { initialData: options.initialData } : {}),
  });
}

export function useProduct(
  idOrSlug: string,
  isSlug = false,
  options?: { initialData?: ApiResponse<Product> },
) {
  return useQuery({
    queryKey: ['product', isSlug ? 'slug' : 'id', idOrSlug],
    queryFn: () =>
      isSlug
        ? productsService.getProductBySlug(idOrSlug)
        : productsService.getProductById(idOrSlug),
    enabled: Boolean(idOrSlug),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 15,
    ...(options?.initialData ? { initialData: options.initialData } : {}),
  });
}

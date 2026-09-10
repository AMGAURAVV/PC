import { useQuery } from '@tanstack/react-query';
import { brandsService } from '../services/brands.service';

export function useBrands(search?: string) {
  return useQuery({
    queryKey: ['brands', search],
    queryFn: () => brandsService.getBrands(search),
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

export function useBrand(slug: string) {
  return useQuery({
    queryKey: ['brand', slug],
    queryFn: () => brandsService.getBrandBySlug(slug),
    enabled: Boolean(slug),
    staleTime: 1000 * 60 * 60,
  });
}

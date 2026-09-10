'use client';

import { useQuery } from '@tanstack/react-query';
import { productsService } from '../services/products.service';

export function usePriceHistory(
  productId: string,
  options?: { variantId?: string | undefined; enabled?: boolean | undefined },
) {
  return useQuery({
    queryKey: ['price-history', productId, options?.variantId],
    queryFn: () =>
      productsService.getPriceHistory(productId, {
        variantId: options?.variantId,
        limit: 100,
      }),
    enabled: Boolean(productId) && (options?.enabled ?? true),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

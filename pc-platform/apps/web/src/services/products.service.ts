import { getProducts, getProductById, getProductBySlug, getProductPriceHistory } from '../lib/api/client';
import type { Product, PaginatedResponse, ApiResponse, ProductPriceSummary } from '@pc-platform/types';
import type { ProductFilters } from '@pc-platform/validation';

export const productsService = {
  async getProducts(filters?: Partial<ProductFilters>): Promise<PaginatedResponse<Product>> {
    return getProducts(filters ?? {});
  },

  async getProductById(id: string): Promise<ApiResponse<Product>> {
    return getProductById(id);
  },

  async getProductBySlug(slug: string): Promise<ApiResponse<Product>> {
    return getProductBySlug(slug);
  },

  async compareProducts(ids: string[]): Promise<ApiResponse<any>> {
    const res = await fetch(`/api/v1/products/compare?ids=${ids.join(',')}`);
    if (!res.ok) {
      throw new Error('Failed to compare products');
    }
    return res.json();
  },

  async getPriceHistory(
    productId: string,
    params?: { variantId?: string | undefined; page?: number | undefined; limit?: number | undefined },
  ): Promise<ApiResponse<ProductPriceSummary>> {
    return getProductPriceHistory(productId, params);
  },
};


import { API_ENDPOINTS } from '../lib/api/endpoints';
import type { ApiResponse, PaginatedResponse } from '@pc-platform/types';

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  websiteUrl?: string | null;
  countryCode?: string | null;
  productCount?: number;
  isActive?: boolean;
}

export const brandsService = {
  async getBrands(search?: string): Promise<ApiResponse<Brand[]>> {
    const url = search
      ? `${API_ENDPOINTS.BRANDS.LIST}?search=${encodeURIComponent(search)}`
      : API_ENDPOINTS.BRANDS.LIST;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to fetch brands: ${res.statusText}`);
    }
    return res.json();
  },

  async getBrandBySlug(slug: string): Promise<ApiResponse<Brand>> {
    const res = await fetch(API_ENDPOINTS.BRANDS.BY_SLUG(slug));
    if (!res.ok) {
      throw new Error(`Failed to fetch brand by slug ${slug}`);
    }
    return res.json();
  },
};

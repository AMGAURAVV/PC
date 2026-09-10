import { getCategories } from '../lib/api/client';
import type { Category, ApiResponse } from '@pc-platform/types';

export const categoriesService = {
  async getCategories(): Promise<ApiResponse<Category[]>> {
    return getCategories();
  },
};

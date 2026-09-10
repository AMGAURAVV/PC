import { API_ENDPOINTS } from '../lib/api/endpoints';
import type { ApiResponse, PaginatedResponse } from '@pc-platform/types';

export interface ProductReview {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  title: string;
  comment: string;
  createdAt: string;
  verifiedPurchase?: boolean;
}

export interface CreateReviewInput {
  productId: string;
  rating: number;
  title: string;
  comment: string;
}

export const reviewsService = {
  async getProductReviews(productId: string, page = 1, limit = 10): Promise<PaginatedResponse<ProductReview>> {
    const res = await fetch(`${API_ENDPOINTS.REVIEWS.BY_PRODUCT(productId)}?page=${page}&limit=${limit}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch reviews for product ${productId}`);
    }
    return res.json();
  },

  async createReview(input: CreateReviewInput): Promise<ApiResponse<ProductReview>> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('nexus_auth_token') : null;
    const res = await fetch(API_ENDPOINTS.REVIEWS.CREATE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(err.message || 'Failed to submit review');
    }
    return res.json();
  },
};

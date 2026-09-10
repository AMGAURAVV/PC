import { API_ENDPOINTS } from '../lib/api/endpoints';
import type { ApiResponse } from '@pc-platform/types';

export interface CommunityBuildItem {
  productId?: string | undefined;
  name: string;
  componentType?: string | undefined;
  price?: number | undefined;
  quantity?: number | undefined;
  imageUrl?: string | undefined;
  specs?: Record<string, any> | undefined;
}

export interface CommunityBuild {
  id: string;
  slug: string;
  name: string;
  description?: string | null | undefined;
  useCase: string;
  totalPrice: number;
  currency: string;
  cpuName?: string | null | undefined;
  gpuName?: string | null | undefined;
  motherboardName?: string | null | undefined;
  ramInfo?: string | null | undefined;
  storageInfo?: string | null | undefined;
  caseName?: string | null | undefined;
  psuInfo?: string | null | undefined;
  coolerName?: string | null | undefined;
  images: string[];
  components: CommunityBuildItem[];
  compatibilitySummary?: {
    status?: string | undefined;
    estimatedWattage?: number | undefined;
    recommendedPsuW?: number | undefined;
    warnings?: string[] | undefined;
  } | undefined;
  author: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string | null | undefined;
  };
  isFeatured: boolean;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  hasLiked?: boolean | undefined;
  publishedAt: string;
  createdAt: string;
}

export interface CommunityComment {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string | null | undefined;
  };
}

export interface QueryCommunityBuildsParams {
  search?: string | undefined;
  sort?: 'popular' | 'latest' | 'price_asc' | 'price_desc' | 'featured' | undefined;
  useCase?: string | undefined;
  gpu?: string | undefined;
  cpu?: string | undefined;
  minPrice?: number | undefined;
  maxPrice?: number | undefined;
  page?: number | undefined;
  limit?: number | undefined;
}

export interface CommunityFilterMetadata {
  useCases: string[];
  cpus: string[];
  gpus: string[];
  priceRange: { min: number; max: number };
}

const getApiBase = () => {
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
  }
  return process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
};

export const communityService = {
  async getBuilds(params?: QueryCommunityBuildsParams): Promise<ApiResponse<CommunityBuild[]>> {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.sort) query.set('sort', params.sort);
    if (params?.useCase) query.set('useCase', params.useCase);
    if (params?.gpu) query.set('gpu', params.gpu);
    if (params?.cpu) query.set('cpu', params.cpu);
    if (params?.minPrice !== undefined) query.set('minPrice', String(params.minPrice));
    if (params?.maxPrice !== undefined) query.set('maxPrice', String(params.maxPrice));
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));

    const qs = query.toString();
    const url = `${getApiBase()}${API_ENDPOINTS.COMMUNITY.BUILDS}${qs ? `?${qs}` : ''}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to fetch community builds: ${res.statusText}`);
    }
    return res.json();
  },

  async getFilters(): Promise<ApiResponse<CommunityFilterMetadata>> {
    const url = `${getApiBase()}${API_ENDPOINTS.COMMUNITY.FILTERS}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to fetch filter metadata: ${res.statusText}`);
    }
    return res.json();
  },

  async getBuildBySlug(slug: string): Promise<ApiResponse<CommunityBuild>> {
    const url = `${getApiBase()}${API_ENDPOINTS.COMMUNITY.BY_SLUG(slug)}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to fetch community build: ${res.statusText}`);
    }
    return res.json();
  },

  async toggleLike(id: string): Promise<ApiResponse<{ liked: boolean; likeCount: number }>> {
    const url = `${getApiBase()}${API_ENDPOINTS.COMMUNITY.LIKE(id)}`;
    const res = await fetch(url, { method: 'POST' });
    if (!res.ok) {
      throw new Error(`Failed to toggle like: ${res.statusText}`);
    }
    return res.json();
  },

  async getComments(id: string): Promise<ApiResponse<CommunityComment[]>> {
    const url = `${getApiBase()}${API_ENDPOINTS.COMMUNITY.COMMENTS(id)}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to fetch comments: ${res.statusText}`);
    }
    return res.json();
  },

  async addComment(id: string, content: string): Promise<ApiResponse<CommunityComment>> {
    const url = `${getApiBase()}${API_ENDPOINTS.COMMUNITY.COMMENTS(id)}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    if (!res.ok) {
      throw new Error(`Failed to post comment: ${res.statusText}`);
    }
    return res.json();
  },

  async reportBuild(id: string, reason: string, details?: string): Promise<ApiResponse<{ success: boolean }>> {
    const url = `${getApiBase()}${API_ENDPOINTS.COMMUNITY.REPORT(id)}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason, details }),
    });
    if (!res.ok) {
      throw new Error(`Failed to report build: ${res.statusText}`);
    }
    return res.json();
  },
};

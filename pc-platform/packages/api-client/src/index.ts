// ──────────────────────────────────────────────────────────────
// @pc-platform/api-client — Typed HTTP client
//
// All API calls in apps/web and apps/admin go through this
// package. Never use fetch() directly in components.
//
// Usage:
//   import { getProducts, login } from '@pc-platform/api-client';
// ──────────────────────────────────────────────────────────────

import type {
  ApiResponse,
  PaginatedResponse,
  AuthTokens,
  Build,
  BuildComponents,
  Category,
  CompatibilityResult,
  CreateBuildInput,
  CreateOrderInput,
  CreateUserInput,
  LoginInput,
  Order,
  Product,
  User,
} from '@pc-platform/types';
import type { ProductFilters } from '@pc-platform/validation';

// ── HTTP Client Core ───────────────────────────────────────────

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  token?: string;
  tags?: string[]; // Next.js fetch cache tags
  revalidate?: number; // Next.js revalidation seconds
};

let _baseUrl = '';
let _getToken: () => string | null = () => null;

/**
 * Configure the API client.
 * Call this once at app startup (e.g., in layout.tsx or providers.tsx).
 */
export function configureApiClient(options: {
  baseUrl: string;
  getToken?: () => string | null;
}) {
  _baseUrl = options.baseUrl;
  if (options.getToken) _getToken = options.getToken;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, token, tags, revalidate } = options;

  const resolvedToken = token ?? _getToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(resolvedToken ? { Authorization: `Bearer ${resolvedToken}` } : {}),
  };

  const fetchOptions: RequestInit & { next?: { tags?: string[]; revalidate?: number } } = {
    method,
    headers,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    // Next.js cache integration
    next: {
      ...(tags ? { tags } : {}),
      ...(revalidate !== undefined ? { revalidate } : {}),
    },
  };

  const res = await fetch(`${_baseUrl}${path}`, fetchOptions);

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new ApiClientError(res.status, error);
  }

  return res.json() as Promise<T>;
}

export class ApiClientError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly body: unknown,
  ) {
    super(`API error ${statusCode}`);
    this.name = 'ApiClientError';
  }
}

// ── Auth ───────────────────────────────────────────────────────

export async function register(input: CreateUserInput): Promise<ApiResponse<User>> {
  return request('/auth/register', { method: 'POST', body: input });
}

export async function login(input: LoginInput): Promise<ApiResponse<AuthTokens>> {
  return request('/auth/login', { method: 'POST', body: input });
}

export async function refreshToken(): Promise<ApiResponse<AuthTokens>> {
  return request('/auth/refresh', { method: 'POST' });
}

export async function logout(): Promise<void> {
  return request('/auth/logout', { method: 'POST' });
}

export async function getCurrentUser(): Promise<ApiResponse<User>> {
  return request('/auth/me');
}

// ── Products ───────────────────────────────────────────────────

export async function getProducts(
  filters: Partial<ProductFilters> = {},
): Promise<PaginatedResponse<Product>> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.set(key, String(value));
    }
  });

  const query = params.toString();
  return request(`/products${query ? `?${query}` : ''}`, {
    tags: ['products'],
    revalidate: 300, // 5 minutes
  });
}

export async function getProductById(id: string): Promise<ApiResponse<Product>> {
  return request(`/products/${id}`, {
    tags: [`product-${id}`],
    revalidate: 300,
  });
}

export async function getProductBySlug(slug: string): Promise<ApiResponse<Product>> {
  return request(`/products/slug/${slug}`, {
    tags: [`product-slug-${slug}`],
    revalidate: 300,
  });
}

// ── Categories ─────────────────────────────────────────────────

export async function getCategories(): Promise<ApiResponse<Category[]>> {
  return request('/categories', {
    tags: ['categories'],
    revalidate: 3600, // 1 hour (categories change infrequently)
  });
}

// ── Builds ─────────────────────────────────────────────────────

export async function getBuilds(): Promise<PaginatedResponse<Build>> {
  return request('/builds');
}

export async function getBuildById(id: string): Promise<ApiResponse<Build>> {
  return request(`/builds/${id}`);
}

export async function createBuild(input: CreateBuildInput): Promise<ApiResponse<Build>> {
  return request('/builds', { method: 'POST', body: input });
}

export async function updateBuild(
  id: string,
  input: Partial<CreateBuildInput>,
): Promise<ApiResponse<Build>> {
  return request(`/builds/${id}`, { method: 'PUT', body: input });
}

export async function deleteBuild(id: string): Promise<void> {
  return request(`/builds/${id}`, { method: 'DELETE' });
}

export async function checkCompatibility(
  components: BuildComponents,
): Promise<ApiResponse<CompatibilityResult>> {
  return request('/builds/check-compatibility', { method: 'POST', body: components });
}

// ── Orders ─────────────────────────────────────────────────────

export async function getOrders(): Promise<PaginatedResponse<Order>> {
  return request('/orders');
}

export async function getOrderById(id: string): Promise<ApiResponse<Order>> {
  return request(`/orders/${id}`);
}

export async function createOrder(input: CreateOrderInput): Promise<ApiResponse<Order>> {
  return request('/orders', { method: 'POST', body: input });
}

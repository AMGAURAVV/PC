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
  EvaluateBuildInput,
  BuildCalculations,
  CreateOrderInput,
  CreateUserInput,
  LoginInput,
  Order,
  Product,
  User,
  UseCaseDefinition,
  ConfiguratorBaseBuild,
  ConfiguratorOptionsResponse,
  RecommendationInput,
  RecommendationResult,
  CheckoutSummaryInput,
  CheckoutSummaryResult,
  CheckoutOrderInput,
  CouponValidationResult,
  PaymentIntentResponse,
  PaymentVerificationInput,
  PaymentVerificationResponse,
  SearchResult,
  SearchFacets,
  SearchFilterInput,
  SearchSuggestion,
  ProductPriceSummary,
  PriceHistoryRecord,
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

export async function getProductPriceHistory(
  productId: string,
  params?: { variantId?: string | undefined; page?: number | undefined; limit?: number | undefined } | undefined,
): Promise<ApiResponse<ProductPriceSummary>> {
  const query = new URLSearchParams();
  if (params?.variantId) query.set('variantId', params.variantId);
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  const qStr = query.toString();
  return request(`/prices/product/${productId}/history${qStr ? `?${qStr}` : ''}`, {
    tags: [`price-history-${productId}`],
    revalidate: 60,
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

export async function evaluateBuild(
  input: EvaluateBuildInput,
): Promise<ApiResponse<BuildCalculations>> {
  return request('/builds/evaluate', { method: 'POST', body: input });
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

// ── Guided Configurator ────────────────────────────────────────

export async function getConfiguratorUseCases(): Promise<ApiResponse<UseCaseDefinition[]>> {
  return request('/configurator/use-cases', { revalidate: 3600 });
}

export async function getBaseBuilds(params?: {
  useCase?: string;
  budgetMin?: number;
  budgetMax?: number;
}): Promise<ApiResponse<ConfiguratorBaseBuild[]>> {
  const query = new URLSearchParams();
  if (params?.useCase) query.set('useCase', params.useCase);
  if (params?.budgetMin) query.set('budgetMin', String(params.budgetMin));
  if (params?.budgetMax) query.set('budgetMax', String(params.budgetMax));
  const queryString = query.toString();
  return request(`/configurator/base-builds${queryString ? `?${queryString}` : ''}`, {
    revalidate: 300,
  });
}

export async function getConfiguratorOptions(
  baseBuildId: string,
): Promise<ApiResponse<ConfiguratorOptionsResponse>> {
  return request(`/configurator/base-builds/${baseBuildId}/options`, { revalidate: 300 });
}

// ── Recommendation Engine ──────────────────────────────────────

export async function getRecommendation(
  input: RecommendationInput,
): Promise<ApiResponse<RecommendationResult>> {
  return request('/recommendations', { method: 'POST', body: input });
}

// ── Commerce, Checkout & Payments ──────────────────────────────

export async function getCheckoutSummary(
  input: CheckoutSummaryInput,
): Promise<ApiResponse<CheckoutSummaryResult>> {
  return request('/orders/checkout-summary', { method: 'POST', body: input });
}

export async function checkoutOrder(
  input: CheckoutOrderInput,
): Promise<ApiResponse<{ order: Order; paymentIntent: PaymentIntentResponse }>> {
  return request('/orders/checkout', { method: 'POST', body: input });
}

export async function validateCoupon(
  code: string,
  orderAmount: number,
): Promise<ApiResponse<CouponValidationResult>> {
  return request('/coupons/validate', { method: 'POST', body: { code, orderAmount } });
}

export async function createPaymentIntent(
  orderId: string,
): Promise<ApiResponse<PaymentIntentResponse>> {
  return request('/payments/create-intent', { method: 'POST', body: { orderId } });
}

export async function verifyPayment(
  input: PaymentVerificationInput,
): Promise<ApiResponse<PaymentVerificationResponse>> {
  return request('/payments/verify', { method: 'POST', body: input });
}

export async function addBuildBundleToCart(
  buildId: string,
): Promise<ApiResponse<{ message: string; cart: any }>> {
  return request(`/cart/bundle/${buildId}`, { method: 'POST' });
}

// ── Search & Autocomplete ──────────────────────────────────────

export async function searchProducts(
  input: SearchFilterInput = {},
): Promise<ApiResponse<SearchResult<Product>>> {
  const params = new URLSearchParams();
  if (input.query) params.set('q', input.query);
  if (input.page) params.set('page', String(input.page));
  if (input.limit) params.set('limit', String(input.limit));
  if (input.sortBy) params.set('sortBy', input.sortBy);
  if (input.minPrice !== undefined) params.set('minPrice', String(input.minPrice));
  if (input.maxPrice !== undefined) params.set('maxPrice', String(input.maxPrice));
  if (input.inStock !== undefined) params.set('inStock', String(input.inStock));

  if (input.category) {
    if (Array.isArray(input.category)) {
      input.category.forEach((c) => params.append('category', c));
    } else {
      params.set('category', input.category);
    }
  }

  if (input.brand) {
    if (Array.isArray(input.brand)) {
      input.brand.forEach((b) => params.append('brand', b));
    } else {
      params.set('brand', input.brand);
    }
  }

  if (input.componentType) {
    if (Array.isArray(input.componentType)) {
      input.componentType.forEach((ct) => params.append('componentType', ct));
    } else {
      params.set('componentType', input.componentType);
    }
  }

  if (input.specs) {
    params.set('specs', JSON.stringify(input.specs));
  }

  const query = params.toString();
  return request(`/search${query ? `?${query}` : ''}`, {
    tags: ['search'],
    revalidate: 60,
  });
}

export async function getSearchSuggestions(
  query: string,
  limit: number = 8,
): Promise<ApiResponse<SearchSuggestion[]>> {
  const params = new URLSearchParams();
  params.set('q', query);
  params.set('limit', String(limit));
  return request(`/search/suggest?${params.toString()}`);
}

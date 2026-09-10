// ──────────────────────────────────────────────────────────────
// @pc-platform/types — Shared TypeScript Definitions
// Single source of truth for all domain types across frontend
// and backend. Zero runtime dependencies.
// ──────────────────────────────────────────────────────────────

// ── Enums ─────────────────────────────────────────────────────

export enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export enum ComponentCategory {
  CPU = 'CPU',
  MOTHERBOARD = 'MOTHERBOARD',
  RAM = 'RAM',
  GPU = 'GPU',
  STORAGE = 'STORAGE',
  PSU = 'PSU',
  CASE = 'CASE',
  COOLING = 'COOLING',
  FAN = 'FAN',
  EXPANSION_CARD = 'EXPANSION_CARD',
  MONITOR = 'MONITOR',
  PERIPHERALS = 'PERIPHERALS',
  OS = 'OS',
  OTHER = 'OTHER',
}

// ── Shared primitive types ─────────────────────────────────────

export type ID = string; // cuid

export type Timestamp = string; // ISO 8601

export type Money = {
  amount: number; // In paise (₹1 = 100 paise)
  currency: 'INR';
  formatted: string; // e.g., "₹12,499"
};

// ── Pagination ─────────────────────────────────────────────────

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type PaginatedResponse<T> = {
  success: true;
  data: T[];
  meta: PaginationMeta;
};

export type ApiResponse<T> = {
  success: true;
  data: T;
};

export type ApiErrorResponse = {
  success: false;
  statusCode: number;
  error: string;
  message: string;
  details?: { field: string; message: string }[];
  timestamp: Timestamp;
  path: string;
};

// ── User ───────────────────────────────────────────────────────

export type User = {
  id: ID;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  isVerified: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type CreateUserInput = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type AuthTokens = {
  accessToken: string;
};

// ── Address ────────────────────────────────────────────────────

export type Address = {
  id: ID;
  userId: ID;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
};

// ── Category ───────────────────────────────────────────────────

export type Category = {
  id: ID;
  name: string;
  slug: string;
  description?: string;
  parentId?: ID;
  children?: Category[];
};

// ── Product ────────────────────────────────────────────────────

export type ProductImage = {
  id: ID;
  url: string;
  storageKey?: string;
  alt?: string;
  altText?: string;
  position?: number;
  sortOrder?: number;
  width?: number;
  height?: number;
  isPrimary?: boolean;
};

export type ComponentSpec = {
  socketType?: string;
  formFactor?: string;
  tdp?: number;
  ramType?: string;
  ramSlots?: number;
  maxRamGb?: number;
  storageInterface?: string;
  powerConnector?: string;
  wattage?: number;
  pcieSlots?: number;
  maxGpuLength?: number;
};

export type Product = {
  id: ID;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  price: number; // In INR
  compareAtPrice?: number;
  sku: string;
  stock: number;
  isActive: boolean;
  isFeatured: boolean;
  category: Category;
  componentCategory: ComponentCategory;
  brand: string;
  model: string;
  specifications: Record<string, string | number | boolean>;
  images: ProductImage[];
  compatSpecs?: ComponentSpec;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type ProductFilters = {
  category?: string;
  componentCategory?: ComponentCategory;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: 'price' | 'name' | 'createdAt';
  order?: 'asc' | 'desc';
  search?: string;
  inStock?: boolean;
  page?: number;
  limit?: number;
};

// ── Build ──────────────────────────────────────────────────────

export type BuildItem = {
  id: ID;
  product: Product;
  quantity: number;
};

export type Build = {
  id: ID;
  userId: ID;
  name: string;
  description?: string;
  isPublic: boolean;
  totalPrice: number;
  items: BuildItem[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type CreateBuildInput = {
  name: string;
  description?: string;
  isPublic?: boolean;
  items: { productId: ID; quantity: number }[];
};

export type EvaluateBuildInput = {
  items: { productId: ID; quantity?: number }[];
};

export type BuildCalculations = {
  totalPrice: number;
  estimatedPowerW: number;
  recommendedPsuW: number;
  performanceScore: number;
  valueScore: number;
  compatibilityResult: CompatibilityResult;
};

// ── Compatibility ──────────────────────────────────────────────

export enum CompatibilityCategory {
  SOCKET = 'SOCKET',
  CHIPSET = 'CHIPSET',
  MEMORY = 'MEMORY',
  PHYSICAL_CLEARANCE = 'PHYSICAL_CLEARANCE',
  POWER = 'POWER',
  COOLING = 'COOLING',
  STORAGE = 'STORAGE',
  EXPANSION = 'EXPANSION',
  BIOS = 'BIOS',
  CONNECTORS = 'CONNECTORS',
  OTHER = 'OTHER',
}

export type CompatibilityStatus = 'compatible' | 'incompatible' | 'warning' | 'unknown';
export type IssueSeverity = 'error' | 'warning' | 'info' | 'unknown';

export type CompatibilityComponentSpec = {
  productId: ID;
  name: string;
  category: ComponentCategory;
  specs: Record<string, string | number | boolean | any>;
};

export type BuildComponents = {
  cpu?: CompatibilityComponentSpec;
  motherboard?: CompatibilityComponentSpec;
  cpuCooler?: CompatibilityComponentSpec;
  cooling?: CompatibilityComponentSpec; // alias for cpuCooler
  ram?: CompatibilityComponentSpec[];
  gpu?: CompatibilityComponentSpec;
  storage?: CompatibilityComponentSpec[];
  psu?: CompatibilityComponentSpec;
  case?: CompatibilityComponentSpec;
  fans?: CompatibilityComponentSpec[];
  expansionCards?: CompatibilityComponentSpec[];
  monitor?: CompatibilityComponentSpec;
  otherComponents?: CompatibilityComponentSpec[];
};

export type CompatibilityIssueItem = {
  severity: IssueSeverity;
  category: CompatibilityCategory | string;
  title: string;
  explanation: string;
  affectedComponents: ID[];
  ruleId: string;
  suggestedResolution: string;
  // Backward compatibility fields:
  rule?: string;
  message?: string;
  components?: ID[];
};

export type CompatibilityIssue = CompatibilityIssueItem;
export type CompatibilityWarning = CompatibilityIssueItem;

export type CompatibilityTelemetry = {
  evaluatedRulesCount: number;
  passedRulesCount: number;
  failedRulesCount: number;
  warningRulesCount: number;
  unknownRulesCount: number;
  executionTimeMs: number;
};

export type CompatibilityResult = {
  status: CompatibilityStatus;
  compatible: boolean;
  issues: CompatibilityIssueItem[];
  warnings: CompatibilityIssueItem[];
  info?: CompatibilityIssueItem[];
  summary: string;
  telemetry?: CompatibilityTelemetry;
};

// ── Order ──────────────────────────────────────────────────────

export type OrderItem = {
  id: ID;
  productId: ID;
  productName: string; // Snapshot at time of order
  price: number; // Snapshot at time of order
  quantity: number;
};

export type Order = {
  id: ID;
  userId: ID;
  buildId?: ID;
  status: OrderStatus;
  subtotal: number;
  shippingCost: number;
  tax: number;
  total: number;
  shippingAddress: Address;
  items: OrderItem[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type CreateOrderInput = {
  buildId?: ID;
  items: { productId: ID; quantity: number }[];
  shippingAddressId: ID;
};

// ── Guided Configurator Domain ─────────────────────────────────

export type ConfiguratorUseCase =
  | 'gaming'
  | 'creator'
  | 'streaming'
  | 'productivity'
  | 'workstation'
  | 'budget';

export interface UseCaseDefinition {
  id: ConfiguratorUseCase;
  name: string;
  tagline: string;
  description: string;
  iconName: string;
  popularApps: string[];
  recommendedBudgetMin: number;
  recommendedBudgetMax: number;
}

export type ConfiguratorSlot =
  | 'cpu'
  | 'gpu'
  | 'ram'
  | 'storage'
  | 'cooling'
  | 'case'
  | 'psu'
  | 'os'
  | 'accessories'
  | 'warranty';

export interface ConfiguratorUpgradeOption {
  id: string;
  slot: ConfiguratorSlot;
  productId?: string;
  name: string;
  brand: string;
  price: number;
  deltaPrice: number;
  isDefault: boolean;
  specs: Record<string, string | number | boolean>;
  whyItMatters: string;
  compatibilityStatus: CompatibilityStatus;
  performanceImpact?: {
    fpsGainPercent?: number;
    renderSpeedGainPercent?: number;
    multitaskingScore?: number;
  };
}

export interface ConfiguratorBaseBuild {
  id: string;
  name: string;
  tier: string;
  useCase: ConfiguratorUseCase;
  basePrice: number;
  targetResolution: string;
  description: string;
  imageUrl?: string;
  baselineSpecs: Record<ConfiguratorSlot, string>;
  defaultItemIds: Partial<Record<ConfiguratorSlot, string>>;
}

export interface ConfiguratorOptionsResponse {
  baseBuild: ConfiguratorBaseBuild;
  optionsBySlot: Record<ConfiguratorSlot, ConfiguratorUpgradeOption[]>;
}

// ── Recommendation Engine Domain ───────────────────────────────

export type ResolutionTarget = '1080p' | '1440p' | '4k';
export type RgbPreference = 'none' | 'subtle' | 'maximum';
export type UpgradePreference = 'immediate_value' | 'future_upgradeability' | 'balanced';

export interface RecommendationInput {
  budget: number;
  useCase: string;
  preferredGames?: string[];
  resolution?: ResolutionTarget;
  targetFps?: number;
  creatorApplications?: string[];
  streamingRequirement?: boolean;
  storageRequirement?: number;
  wifiRequirement?: boolean;
  rgbPreference?: RgbPreference;
  upgradePreference?: UpgradePreference;
}

export interface RecommendationScoringBreakdown {
  performance: number;
  priceEfficiency: number;
  compatibility: number;
  availability: number;
  powerEfficiency: number;
  upgradeability: number;
  userPreferences: number;
  overallScore: number;
}

export interface ComponentRecommendationItem {
  slot: string;
  productId: string;
  name: string;
  brand: string;
  price: number;
  specs: Record<string, string | number | boolean>;
  reason: string;
  score?: number;
}

export interface RecommendationResult {
  recommendedComponents: Record<string, ComponentRecommendationItem>;
  alternativeComponents: Record<string, ComponentRecommendationItem[]>;
  estimatedCost: number;
  compatibilityScore: number;
  performanceScore: number;
  valueScore: number;
  upgradeScore: number;
  scoringBreakdown: RecommendationScoringBreakdown;
  rationale: string;
}

// ── Commerce & Checkout Domain ─────────────────────────────────

export interface AddressInput {
  firstName: string;
  lastName: string;
  phone?: string | undefined;
  line1: string;
  line2?: string | undefined;
  city: string;
  state: string;
  postalCode: string;
  country?: string | undefined;
}

export interface CouponValidationResult {
  valid: boolean;
  couponCode?: string | undefined;
  couponType?: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING' | undefined;
  discountAmount: number;
  message: string;
}

export interface CheckoutSummaryItem {
  productId: string;
  variantId?: string | undefined;
  productName: string;
  brand: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  inStock: boolean;
  availableStock: number;
}

export interface CheckoutSummaryInput {
  items?: { productId: string; variantId?: string | undefined; quantity: number }[] | undefined;
  buildId?: string | undefined;
  couponCode?: string | undefined;
  shippingOption?: ('standard' | 'express') | undefined;
}

export interface CheckoutSummaryResult {
  items: CheckoutSummaryItem[];
  itemCount: number;
  subtotal: number;
  discountAmount: number;
  shippingCost: number;
  taxAmount: number; // 18% GST component
  total: number;
  appliedCoupon?: CouponValidationResult | undefined;
  isBuildBundle?: boolean | undefined;
  buildCompatibility?: {
    status: CompatibilityStatus;
    compatible: boolean;
    issuesCount: number;
    warningsCount: number;
  } | undefined;
  inventoryAvailable: boolean;
  unavailableItems: { productId: string; requestedQty: number; availableQty: number }[];
}

export interface CheckoutOrderInput {
  shippingAddress: AddressInput;
  billingAddress?: AddressInput | undefined;
  useShippingForBilling?: boolean | undefined;
  couponCode?: string | undefined;
  buildId?: string | undefined;
  items?: { productId: string; variantId?: string | undefined; quantity: number }[] | undefined;
  shippingOption?: ('standard' | 'express') | undefined;
  notes?: string | undefined;
}

export interface PaymentIntentResponse {
  paymentId: string;
  orderId: string;
  orderNumber: string;
  amount: number;
  currency: string;
  provider: 'MOCK' | 'RAZORPAY' | 'STRIPE';
  clientSecret?: string | undefined;
  providerOrderId?: string | undefined;
  status: string;
}

export interface PaymentVerificationInput {
  orderId: string;
  paymentId?: string | undefined;
  providerPaymentId: string;
  providerOrderId?: string | undefined;
  signature?: string | undefined;
}

export interface PaymentVerificationResponse {
  verified: boolean;
  orderId: string;
  orderNumber: string;
  orderStatus: OrderStatus;
  paymentStatus: string;
  message: string;
}

// ── Search Domain ──────────────────────────────────────────────

export interface FacetBucket {
  value: string;
  label: string;
  count: number;
}

export interface SearchFacets {
  categories: FacetBucket[];
  brands: FacetBucket[];
  componentTypes: FacetBucket[];
  priceRange: { min: number; max: number };
  inStockCount: number;
  specifications?: Record<string, FacetBucket[]> | undefined;
}

export interface SearchFilterInput {
  query?: string | undefined;
  category?: string | string[] | undefined;
  brand?: string | string[] | undefined;
  componentType?: string | string[] | undefined;
  minPrice?: number | undefined;
  maxPrice?: number | undefined;
  inStock?: boolean | undefined;
  sortBy?: ('relevance' | 'price_asc' | 'price_desc' | 'newest' | 'name_asc' | 'name_desc') | undefined;
  page?: number | undefined;
  limit?: number | undefined;
  specs?: Record<string, any> | undefined;
}

export interface SearchResult<T = Product> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  facets: SearchFacets;
}

export interface SearchSuggestion {
  id?: string | undefined;
  title: string;
  type: 'product' | 'brand' | 'category' | 'spec' | 'query';
  slug?: string | undefined;
  category?: string | undefined;
  price?: number | undefined;
}

// ── Price History & Governance Domain ──────────────────────────

export interface PriceHistoryRecord {
  id: string;
  productId: string;
  variantId?: string | null | undefined;
  price: number; // in primary currency units (e.g. INR)
  amount?: number | undefined;
  currency: string;
  source: string;
  effectiveDate: string;
  endDate?: string | null | undefined;
  changedBy?: string | null | undefined;
  reason?: string | null | undefined;
  isCorrection: boolean;
  originalAmount?: number | null | undefined;
  correctionReason?: string | null | undefined;
  correctedBy?: string | null | undefined;
  correctedAt?: string | null | undefined;
  createdAt: string;
}

export interface ProductPriceSummary {
  productId: string;
  variantId?: string | null | undefined;
  currency: string;
  currentPrice: number;
  lowestPrice: number;
  highestPrice: number;
  averagePrice?: number | undefined;
  priceHistory: PriceHistoryRecord[];
  total: number;
}

export interface AdminCorrectPriceHistoryInput {
  amount: number;
  reason: string;
  effectiveDate?: string | undefined;
  endDate?: string | undefined;
}

// ── Community Showcase & Moderation Domain ─────────────────────

export type CommunityModerationStatus = 'PENDING' | 'APPROVED' | 'HIDDEN' | 'REMOVED';

export type CommunityReportReasonType =
  | 'INAPPROPRIATE_CONTENT'
  | 'MISLEADING_SPECS'
  | 'SPAM'
  | 'OFFENSIVE_IMAGE'
  | 'COPYRIGHT_VIOLATION'
  | 'OTHER';

export interface CommunityBuildComponentItem {
  id?: string;
  productId: string;
  name: string;
  componentType: string;
  price: number;
  quantity: number;
  imageUrl?: string | null;
  specs?: Record<string, any>;
  notes?: string | null;
}

export interface CommunityBuildCompatibilitySummary {
  status: 'COMPATIBLE' | 'WARNING' | 'INCOMPATIBLE';
  estimatedWattage?: number;
  recommendedPsuW?: number;
  warnings?: string[];
  notes?: string[];
}

export interface CommunityBuildAuthor {
  id: string;
  name: string;
  email?: string;
  avatarUrl?: string | null;
}

export interface CommunityBuild {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  useCase: string;
  totalPrice: number;
  currency: string;
  cpuName?: string | null;
  gpuName?: string | null;
  motherboardName?: string | null;
  ramInfo?: string | null;
  storageInfo?: string | null;
  caseName?: string | null;
  psuInfo?: string | null;
  coolerName?: string | null;
  images: string[];
  components: CommunityBuildComponentItem[];
  compatibilitySummary?: CommunityBuildCompatibilitySummary | null;
  authorId: string;
  author: CommunityBuildAuthor;
  buildId?: string | null;
  isFeatured: boolean;
  moderationStatus: CommunityModerationStatus;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  isLiked?: boolean;
  moderatorNotes?: string | null;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CommunityBuildComment {
  id: string;
  buildId: string;
  userId: string;
  user: CommunityBuildAuthor;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface CommunityBuildReport {
  id: string;
  buildId: string;
  build?: {
    id: string;
    name: string;
    slug: string;
  };
  userId?: string | null;
  reporterEmail?: string | null;
  reason: CommunityReportReasonType;
  details?: string | null;
  status: 'PENDING' | 'REVIEWED' | 'DISMISSED' | 'ACTIONED';
  resolvedAt?: string | null;
  resolvedBy?: string | null;
  createdAt: string;
}

export interface CommunityBuildFilterParams {
  sort?: 'featured' | 'latest' | 'popular' | 'price_asc' | 'price_desc';
  useCase?: string;
  budgetMin?: number;
  budgetMax?: number;
  gpu?: string;
  cpu?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PublishCommunityBuildInput {
  name: string;
  description?: string;
  useCase: string;
  images: string[];
  buildId?: string;
  components?: CommunityBuildComponentItem[];
  totalPrice?: number;
  cpuName?: string;
  gpuName?: string;
  motherboardName?: string;
  ramInfo?: string;
  storageInfo?: string;
  caseName?: string;
  psuInfo?: string;
  coolerName?: string;
  compatibilitySummary?: CommunityBuildCompatibilitySummary;
}

export interface ModerateCommunityBuildInput {
  action: 'approve' | 'hide' | 'remove' | 'feature' | 'unfeature';
  notes?: string;
}

export interface ReportCommunityBuildInput {
  reason: CommunityReportReasonType;
  details?: string;
  reporterEmail?: string;
}


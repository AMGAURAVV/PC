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
  MONITOR = 'MONITOR',
  PERIPHERALS = 'PERIPHERALS',
  OS = 'OS',
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
  alt?: string;
  position: number;
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

// ── Compatibility ──────────────────────────────────────────────

export type CompatibilityComponentSpec = {
  productId: ID;
  name: string;
  category: ComponentCategory;
  specs: Record<string, string | number | boolean>;
};

export type BuildComponents = {
  cpu?: CompatibilityComponentSpec;
  motherboard?: CompatibilityComponentSpec;
  ram?: CompatibilityComponentSpec[];
  gpu?: CompatibilityComponentSpec;
  storage?: CompatibilityComponentSpec[];
  psu?: CompatibilityComponentSpec;
  case?: CompatibilityComponentSpec;
  cooling?: CompatibilityComponentSpec;
};

export type CompatibilityIssue = {
  severity: 'error';
  rule: string;
  message: string;
  components: ID[];
};

export type CompatibilityWarning = {
  severity: 'warning';
  rule: string;
  message: string;
  components: ID[];
};

export type CompatibilityResult = {
  compatible: boolean;
  issues: CompatibilityIssue[];
  warnings: CompatibilityWarning[];
  summary: string;
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

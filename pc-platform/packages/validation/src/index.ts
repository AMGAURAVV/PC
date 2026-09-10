// ──────────────────────────────────────────────────────────────
// @pc-platform/validation — Shared Zod Schemas
//
// These schemas are the single source of truth for validation.
// Used by:
//   - Frontend: React Hook Form zodResolver
//   - Backend: NestJS ZodValidationPipe
// ──────────────────────────────────────────────────────────────

import { z } from 'zod';
import { ComponentCategory, OrderStatus, Role } from '@pc-platform/types';

// ── Common ─────────────────────────────────────────────────────

export const idSchema = z.string().cuid();

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(24),
});

// ── Auth ───────────────────────────────────────────────────────

export const registerSchema = z
  .object({
    email: z.string().email('Invalid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(72, 'Password too long')
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Must contain at least one number'),
    confirmPassword: z.string(),
    firstName: z.string().min(1, 'First name is required').max(50),
    lastName: z.string().min(1, 'Last name is required').max(50),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

// ── User ───────────────────────────────────────────────────────

export const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
});

export const addressSchema = z.object({
  line1: z.string().min(1, 'Address line 1 is required').max(200),
  line2: z.string().max(200).optional(),
  city: z.string().min(1, 'City is required').max(100),
  state: z.string().min(1, 'State is required').max(100),
  pincode: z.string().regex(/^\d{6}$/, 'Pincode must be a 6-digit number'),
  isDefault: z.boolean().default(false),
});

export type AddressInput = z.infer<typeof addressSchema>;

// ── Product ────────────────────────────────────────────────────

export const productFiltersSchema = z.object({
  category: z.string().optional(),
  componentCategory: z.nativeEnum(ComponentCategory).optional(),
  brand: z.string().optional(),
  minPrice: z.coerce.number().positive().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  sort: z.enum(['price', 'name', 'createdAt']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().max(200).optional(),
  inStock: z.coerce.boolean().optional(),
  ...paginationSchema.shape,
});

export const createProductSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z
    .string()
    .min(1)
    .max(255)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens only'),
  description: z.string().min(1),
  shortDescription: z.string().max(500).optional(),
  price: z.number().positive('Price must be positive'),
  compareAtPrice: z.number().positive().optional(),
  sku: z.string().min(1).max(100),
  stock: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  categoryId: idSchema,
  componentCategory: z.nativeEnum(ComponentCategory),
  brand: z.string().min(1).max(100),
  model: z.string().min(1).max(100),
  specifications: z.record(z.union([z.string(), z.number(), z.boolean()])).default({}),
});

export const updateProductSchema = createProductSchema.partial();

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductFilters = z.infer<typeof productFiltersSchema>;

// ── Build ──────────────────────────────────────────────────────

export const buildItemSchema = z.object({
  productId: idSchema,
  quantity: z.number().int().positive().max(10),
});

export const createBuildSchema = z.object({
  name: z.string().min(1, 'Build name is required').max(100),
  description: z.string().max(500).optional(),
  isPublic: z.boolean().default(false),
  items: z.array(buildItemSchema).min(1, 'Build must have at least one component'),
});

export const updateBuildSchema = createBuildSchema.partial();

export type CreateBuildInput = z.infer<typeof createBuildSchema>;
export type UpdateBuildInput = z.infer<typeof updateBuildSchema>;

// ── Compatibility ──────────────────────────────────────────────

export const compatibilityComponentSchema = z.object({
  productId: idSchema,
  name: z.string().min(1),
  category: z.nativeEnum(ComponentCategory),
  specs: z.record(z.any()),
});

export const buildComponentsSchema = z.object({
  cpu: compatibilityComponentSchema.optional(),
  motherboard: compatibilityComponentSchema.optional(),
  cpuCooler: compatibilityComponentSchema.optional(),
  cooling: compatibilityComponentSchema.optional(),
  ram: z.array(compatibilityComponentSchema).optional(),
  gpu: compatibilityComponentSchema.optional(),
  storage: z.array(compatibilityComponentSchema).optional(),
  psu: compatibilityComponentSchema.optional(),
  case: compatibilityComponentSchema.optional(),
  fans: z.array(compatibilityComponentSchema).optional(),
  expansionCards: z.array(compatibilityComponentSchema).optional(),
  monitor: compatibilityComponentSchema.optional(),
  otherComponents: z.array(compatibilityComponentSchema).optional(),
});

export type BuildComponentsInput = z.infer<typeof buildComponentsSchema>;

// ── Order ──────────────────────────────────────────────────────

export const createOrderSchema = z.object({
  buildId: idSchema.optional(),
  items: z
    .array(
      z.object({
        productId: idSchema,
        quantity: z.number().int().positive().max(50),
      }),
    )
    .min(1, 'Order must have at least one item'),
  shippingAddressId: idSchema,
});

export const updateOrderStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;

// ── Category ───────────────────────────────────────────────────

export const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/),
  description: z.string().max(500).optional(),
  parentId: idSchema.optional(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;

// Re-export role for convenience
export { Role };

import {
  registerSchema,
  loginSchema,
  createProductSchema,
  updateProductSchema,
  productFiltersSchema,
  buildItemSchema,
  createBuildSchema,
  createOrderSchema,
  updateOrderStatusSchema,
  addressSchema,
  updateProfileSchema,
  idSchema,
  paginationSchema,
  compatibilityComponentSchema,
  buildComponentsSchema,
} from './index';
import { ComponentCategory, OrderStatus } from '@pc-platform/types';

describe('Validation Schemas (Unit Tests)', () => {
  const validCuid = 'clh0000000000000000000000';

  describe('Common Schemas', () => {
    it('validates CUID format correctly', () => {
      expect(idSchema.safeParse(validCuid).success).toBe(true);
      expect(idSchema.safeParse('not-a-cuid').success).toBe(false);
      expect(idSchema.safeParse('').success).toBe(false);
    });

    it('validates pagination defaults and constraints', () => {
      const parsed = paginationSchema.parse({});
      expect(parsed.page).toBe(1);
      expect(parsed.limit).toBe(24);

      expect(paginationSchema.safeParse({ page: 0 }).success).toBe(false);
      expect(paginationSchema.safeParse({ limit: 101 }).success).toBe(false);
      expect(paginationSchema.safeParse({ page: '2', limit: '50' }).success).toBe(true);
    });
  });

  describe('Auth Schemas', () => {
    it('accepts valid registration input', () => {
      const valid = {
        email: 'user@nexuspc.in',
        password: 'Password123',
        confirmPassword: 'Password123',
        firstName: 'Aarav',
        lastName: 'Sharma',
      };
      const result = registerSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('rejects passwords without uppercase or numbers', () => {
      const noUpper = {
        email: 'user@nexuspc.in',
        password: 'password123',
        confirmPassword: 'password123',
        firstName: 'Aarav',
        lastName: 'Sharma',
      };
      expect(registerSchema.safeParse(noUpper).success).toBe(false);

      const noNum = {
        email: 'user@nexuspc.in',
        password: 'PasswordABC',
        confirmPassword: 'PasswordABC',
        firstName: 'Aarav',
        lastName: 'Sharma',
      };
      expect(registerSchema.safeParse(noNum).success).toBe(false);
    });

    it('rejects mismatched password and confirmPassword', () => {
      const mismatched = {
        email: 'user@nexuspc.in',
        password: 'Password123',
        confirmPassword: 'Password456',
        firstName: 'Aarav',
        lastName: 'Sharma',
      };
      const result = registerSchema.safeParse(mismatched);
      expect(result.success).toBe(false);
      if (!result.success && result.error) {
        expect(result.error.issues[0]?.message).toBe('Passwords do not match');
      }
    });

    it('validates login input', () => {
      expect(loginSchema.safeParse({ email: 'user@nexuspc.in', password: 'Password123' }).success).toBe(true);
      expect(loginSchema.safeParse({ email: 'bad-email', password: 'Password123' }).success).toBe(false);
      expect(loginSchema.safeParse({ email: 'user@nexuspc.in', password: '' }).success).toBe(false);
    });
  });

  describe('User & Address Schemas', () => {
    it('validates address with 6-digit Indian PIN code', () => {
      const validAddress = {
        line1: '402 Quantum Towers',
        city: 'Hyderabad',
        state: 'Telangana',
        pincode: '500081',
      };
      expect(addressSchema.safeParse(validAddress).success).toBe(true);

      const invalidPin = { ...validAddress, pincode: '50008' };
      expect(addressSchema.safeParse(invalidPin).success).toBe(false);
    });

    it('validates update profile input', () => {
      expect(updateProfileSchema.safeParse({ firstName: 'Gaurav' }).success).toBe(true);
      expect(updateProfileSchema.safeParse({ firstName: '' }).success).toBe(false);
    });
  });

  describe('Product Schemas', () => {
    it('validates create product schema with slug and positive price', () => {
      const validProduct = {
        name: 'AMD Ryzen 7 7800X3D',
        slug: 'amd-ryzen-7-7800x3d',
        description: 'Gaming CPU with 3D V-Cache',
        price: 36999,
        sku: 'CPU-AMD-7800X3D',
        stock: 50,
        categoryId: validCuid,
        componentCategory: ComponentCategory.CPU,
        brand: 'AMD',
        model: '7800X3D',
        specifications: { socket: 'AM5', cores: 8, threads: 16, tdp: 120 },
      };

      const result = createProductSchema.safeParse(validProduct);
      expect(result.success).toBe(true);

      const invalidSlug = { ...validProduct, slug: 'AMD Ryzen 7 7800X3D' };
      expect(createProductSchema.safeParse(invalidSlug).success).toBe(false);

      const negativePrice = { ...validProduct, price: -500 };
      expect(createProductSchema.safeParse(negativePrice).success).toBe(false);
    });

    it('validates partial updates with updateProductSchema', () => {
      expect(updateProductSchema.safeParse({ price: 34999 }).success).toBe(true);
      expect(updateProductSchema.safeParse({ price: -10 }).success).toBe(false);
    });

    it('validates product filters schema', () => {
      const filters = {
        brand: 'ASUS',
        minPrice: '10000',
        maxPrice: '50000',
        sort: 'price',
        order: 'asc',
      };
      const result = productFiltersSchema.safeParse(filters);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.minPrice).toBe(10000);
        expect(result.data.maxPrice).toBe(50000);
      }
    });
  });

  describe('Build Schemas', () => {
    it('validates build item schema', () => {
      expect(buildItemSchema.safeParse({ productId: validCuid, quantity: 2 }).success).toBe(true);
      expect(buildItemSchema.safeParse({ productId: validCuid, quantity: 0 }).success).toBe(false);
      expect(buildItemSchema.safeParse({ productId: validCuid, quantity: 15 }).success).toBe(false);
    });

    it('requires build to have a name and at least one item', () => {
      const validBuild = {
        name: 'Ultimate RTX 4080 Rig',
        items: [{ productId: validCuid, quantity: 1 }],
      };
      expect(createBuildSchema.safeParse(validBuild).success).toBe(true);

      const emptyItems = { name: 'Empty Build', items: [] };
      expect(createBuildSchema.safeParse(emptyItems).success).toBe(false);

      const noName = { name: '', items: [{ productId: validCuid, quantity: 1 }] };
      expect(createBuildSchema.safeParse(noName).success).toBe(false);
    });
  });

  describe('Compatibility Schemas', () => {
    it('validates compatibilityComponentSchema', () => {
      const component = {
        productId: validCuid,
        name: 'NVIDIA GeForce RTX 4080 Super',
        category: ComponentCategory.GPU,
        specs: { vram: 16, tdp: 320, length: 304 },
      };
      expect(compatibilityComponentSchema.safeParse(component).success).toBe(true);
    });

    it('validates buildComponentsSchema with optional slots', () => {
      const buildComp = {
        cpu: {
          productId: validCuid,
          name: 'Intel Core i7-14700K',
          category: ComponentCategory.CPU,
          specs: { socket: 'LGA1700' },
        },
      };
      expect(buildComponentsSchema.safeParse(buildComp).success).toBe(true);
    });
  });

  describe('Order Schemas', () => {
    it('validates create order schema with valid shippingAddressId and items', () => {
      const validOrder = {
        items: [{ productId: validCuid, quantity: 1 }],
        shippingAddressId: validCuid,
      };
      expect(createOrderSchema.safeParse(validOrder).success).toBe(true);

      const emptyOrder = { items: [], shippingAddressId: validCuid };
      expect(createOrderSchema.safeParse(emptyOrder).success).toBe(false);
    });

    it('validates update order status enum', () => {
      expect(updateOrderStatusSchema.safeParse({ status: OrderStatus.CONFIRMED }).success).toBe(true);
      expect(updateOrderStatusSchema.safeParse({ status: OrderStatus.SHIPPED }).success).toBe(true);
      expect(updateOrderStatusSchema.safeParse({ status: 'INVALID_STATUS' }).success).toBe(false);
    });
  });
});

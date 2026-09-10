import * as crypto from 'crypto';

import type { INestApplication} from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { DatabaseService } from '@pc-platform/database';
import request from 'supertest';

import { JwtStrategy } from '../auth/strategies/jwt.strategy';
import { BrandsModule } from '../brands/brands.module';
import { CategoriesModule } from '../categories/categories.module';
import { CacheModule } from '../common/cache/cache.module';
import { CacheService } from '../common/cache/cache.service';
import { AllExceptionsFilter } from '../common/filters/all-exceptions.filter';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ResponseTransformInterceptor } from '../common/interceptors/response-transform.interceptor';
import { DatabaseModule } from '../database/database.module';

import { ProductsModule } from './products.module';

// ─── Shared Mock Fixtures ──────────────────────────────────────────────────────

const mkCpuProduct = (overrides: Record<string, any> = {}) => ({
  id: 'cpu-prod-1',
  name: 'AMD Ryzen 7 7800X3D',
  slug: 'amd-ryzen-7-7800x3d',
  sku: '100-100000910WOF',
  barcode: '730143314930',
  description: '8-core gaming processor',
  shortDescription: 'Ultimate gaming CPU',
  model: '7800X3D',
  componentType: 'CPU',
  brandId: 'brand-amd',
  brand: { id: 'brand-amd', name: 'AMD', slug: 'amd', logoUrl: null },
  isActive: true,
  isDraft: false,
  isFeatured: true,
  weight: 0.15,
  tags: ['gaming', 'am5', 'x3d'],
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
  categories: [
    {
      categoryId: 'cat-cpu',
      isPrimary: true,
      category: { id: 'cat-cpu', name: 'Processors', slug: 'processors' },
    },
  ],
  prices: [
    {
      id: 'price-cpu-1',
      amount: 449.99,
      compareAt: 499.99,
      currency: 'USD',
      priceType: 'RETAIL',
      isActive: true,
    },
  ],
  inventory: [{ id: 'inv-cpu-1', quantity: 25, reservedQty: 5 }],
  images: [
    {
      id: 'img-cpu-1',
      productId: 'cpu-prod-1',
      url: 'https://images.example.com/7800x3d.jpg',
      altText: 'Box front',
      isPrimary: true,
      sortOrder: 0,
    },
  ],
  variants: [],
  cpuSpec: {
    id: 'spec-cpu-1',
    productId: 'cpu-prod-1',
    socketType: 'AM5',
    cores: 8,
    threads: 16,
    baseClockMhz: 4200,
    boostClockMhz: 5000,
    tdpW: 120,
    memoryType: 'DDR5',
    maxMemoryGb: 128,
  },
  gpuSpec: null,
  motherboardSpec: null,
  ramSpec: null,
  storageSpec: null,
  psuSpec: null,
  caseSpec: null,
  coolerSpec: null,
  fanSpec: null,
  monitorSpec: null,
  peripheralSpec: null,
  ...overrides,
});

const mkGpuProduct = (overrides: Record<string, any> = {}) => ({
  id: 'gpu-prod-1',
  name: 'ASUS ROG Strix RTX 4080 Super',
  slug: 'asus-rog-strix-rtx-4080-super',
  sku: 'ROG-STRIX-RTX4080S-O16G',
  barcode: '197105312345',
  description: 'High-end graphics card',
  shortDescription: 'RTX 4080 Super OC Edition',
  model: 'RTX 4080 Super',
  componentType: 'GPU',
  brandId: 'brand-asus',
  brand: { id: 'brand-asus', name: 'ASUS', slug: 'asus', logoUrl: null },
  isActive: true,
  isDraft: false,
  isFeatured: true,
  weight: 1.8,
  tags: ['gpu', 'rtx', 'ada'],
  createdAt: new Date('2026-01-02T00:00:00Z'),
  updatedAt: new Date('2026-01-02T00:00:00Z'),
  categories: [
    {
      categoryId: 'cat-gpu',
      isPrimary: true,
      category: { id: 'cat-gpu', name: 'Graphics Cards', slug: 'graphics-cards' },
    },
  ],
  prices: [
    {
      id: 'price-gpu-1',
      amount: 999.99,
      compareAt: 1099.99,
      currency: 'USD',
      priceType: 'RETAIL',
      isActive: true,
    },
  ],
  inventory: [{ id: 'inv-gpu-1', quantity: 10, reservedQty: 1 }],
  images: [
    {
      id: 'img-gpu-1',
      productId: 'gpu-prod-1',
      url: 'https://images.example.com/4080.jpg',
      altText: 'GPU front',
      isPrimary: true,
      sortOrder: 0,
    },
  ],
  variants: [],
  cpuSpec: null,
  gpuSpec: {
    id: 'spec-gpu-1',
    productId: 'gpu-prod-1',
    chipset: 'AD103-400',
    vramGb: 16,
    vramType: 'GDDR6X',
    vramBusBit: 256,
    tdpW: 320,
    lengthMm: 357,
    powerConnectors: '1x 16-pin',
  },
  motherboardSpec: null,
  ramSpec: null,
  storageSpec: null,
  psuSpec: null,
  caseSpec: null,
  coolerSpec: null,
  fanSpec: null,
  monitorSpec: null,
  peripheralSpec: null,
  ...overrides,
});

// ─── Test Suite ────────────────────────────────────────────────────────────────

/** JWT secret — must match JWT_SECRET in .env (read by JwtStrategy via ConfigService). */
const TEST_JWT_SECRET = 'super-secret-jwt-token-key-for-pc-platform-dev-environment-12345';

/**
 * Hand-rolls an HS256 JWT without any external dependency.
 * Produces a token that JwtStrategy.validate() will accept:
 *   - payload.type === 'access'
 *   - payload.roles[] used by RolesGuard
 */
function signAdminToken(): string {
  const b64url = (obj: object) =>
    Buffer.from(JSON.stringify(obj))
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

  const header = b64url({ alg: 'HS256', typ: 'JWT' });
  const payload = b64url({
    sub: 'test-admin-id',
    email: 'admin@test.com',
    roles: ['admin'],
    type: 'access',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
  });

  const sig = crypto
    .createHmac('sha256', TEST_JWT_SECRET)
    .update(`${header}.${payload}`)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  return `${header}.${payload}.${sig}`;
}

describe('Products Catalog Integration Tests', () => {
  let app: INestApplication;
  let mockDb: any;
  let adminToken: string;
  let cacheService: CacheService;

  beforeAll(async () => {
    mockDb = {
      product: {
        findMany: jest.fn(),
        count: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      price: {
        findFirst: jest.fn(),
        update: jest.fn(),
        create: jest.fn(),
      },
      productCategory: {
        deleteMany: jest.fn(),
        createMany: jest.fn(),
      },
      supplier: {
        findFirst: jest.fn().mockResolvedValue({ id: 'supp-1', isPlatform: true }),
        create: jest.fn().mockResolvedValue({ id: 'supp-1', isPlatform: true }),
      },
      productVariant: {
        create: jest.fn(),
        update: jest.fn(),
      },
      productImage: {
        create: jest.fn(),
        updateMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      category: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      brand: {
        findMany: jest.fn(),
        count: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      cpuSpec: { upsert: jest.fn() },
      gpuSpec: { upsert: jest.fn() },
      motherboardSpec: { upsert: jest.fn() },
      ramSpec: { upsert: jest.fn() },
      storageSpec: { upsert: jest.fn() },
      psuSpec: { upsert: jest.fn() },
      caseSpec: { upsert: jest.fn() },
      coolerSpec: { upsert: jest.fn() },
      fanSpec: { upsert: jest.fn() },
      monitorSpec: { upsert: jest.fn() },
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        CacheModule,
        DatabaseModule,
        // Minimal JWT auth setup — avoids pulling in full AuthModule with its
        // AuditLogsModule, ConfigModule, and LocalStrategy dependencies.
        ConfigModule.forRoot({ isGlobal: true }),
        PassportModule,
        JwtModule.register({
          secret: TEST_JWT_SECRET,
          signOptions: { expiresIn: '1h' },
        }),
        ProductsModule,
        CategoriesModule,
        BrandsModule,
      ],
      // JwtStrategy reads JWT_SECRET from ConfigService; we pass it via env fallback
      providers: [JwtStrategy],
    })
      .overrideProvider(DatabaseService)
      .useValue(mockDb)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    app.useGlobalFilters(new AllExceptionsFilter());
    app.useGlobalInterceptors(new ResponseTransformInterceptor());
    // Apply global JwtAuthGuard exactly as main.ts does — populates request.user
    // so that RolesGuard can check roles on protected endpoints.
    const reflector = moduleFixture.get(Reflector);
    app.useGlobalGuards(new JwtAuthGuard(reflector));
    await app.init();

    // Sign a long-lived admin JWT for protected endpoint tests
    adminToken = signAdminToken();
    cacheService = moduleFixture.get<CacheService>(CacheService);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
    cacheService?.flush();
    // Re-apply supplier mock after each clearAllMocks
    mockDb.supplier.findFirst.mockResolvedValue({ id: 'supp-1', isPlatform: true });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // GET /products — Catalog Browsing, Filtering & Search
  // ═══════════════════════════════════════════════════════════════════════════

  describe('GET /products (Catalog Browsing & Search)', () => {
    it('should return catalog list with pagination envelope', async () => {
      mockDb.product.findMany.mockResolvedValue([mkCpuProduct()]);
      mockDb.product.count.mockResolvedValue(1);

      const res = await request(app.getHttpServer())
        .get('/products')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].name).toBe('AMD Ryzen 7 7800X3D');
      expect(res.body.data[0].price.amount).toBe(449.99);
      expect(res.body.data[0].price.discountPercent).toBe(10);
      expect(res.body.data[0].inventory.inStock).toBe(true);
      expect(res.body.data[0].inventory.availableQuantity).toBe(20);
      expect(res.body.meta.total).toBe(1);
      expect(res.body.meta.page).toBe(1);
      expect(res.body.meta.limit).toBe(20);
    });

    it('should support custom pagination (page=2, limit=5)', async () => {
      mockDb.product.findMany.mockResolvedValue([]);
      mockDb.product.count.mockResolvedValue(15);

      const res = await request(app.getHttpServer())
        .get('/products?page=2&limit=5')
        .expect(200);

      expect(res.body.meta.page).toBe(2);
      expect(res.body.meta.limit).toBe(5);
      expect(res.body.meta.total).toBe(15);
      expect(res.body.meta.totalPages).toBe(3);
      expect(res.body.meta.hasPrevPage).toBe(true);
      expect(mockDb.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 5, take: 5 }),
      );
    });

    it('should return 400 for invalid sortBy value', async () => {
      const res = await request(app.getHttpServer())
        .get('/products?sortBy=invalid_sort')
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should accept valid sortBy enum values', async () => {
      mockDb.product.findMany.mockResolvedValue([]);
      mockDb.product.count.mockResolvedValue(0);

      for (const sortBy of ['newest', 'price_asc', 'price_desc', 'name_asc', 'name_desc', 'featured']) {
        await request(app.getHttpServer())
          .get(`/products?sortBy=${sortBy}`)
          .expect(200);
      }
    });

    it('should sort by PRICE_ASC in-memory', async () => {
      const cheap = mkCpuProduct({ prices: [{ amount: 299.99, isActive: true, priceType: 'RETAIL' }] });
      const expensive = mkCpuProduct({ id: 'cpu-2', prices: [{ amount: 899.99, isActive: true, priceType: 'RETAIL' }] });

      mockDb.product.findMany.mockResolvedValue([expensive, cheap]);
      mockDb.product.count.mockResolvedValue(2);

      const res = await request(app.getHttpServer())
        .get('/products?sortBy=price_asc')
        .expect(200);

      expect(res.body.data[0].price.amount).toBe(299.99);
      expect(res.body.data[1].price.amount).toBe(899.99);
    });

    it('should sort by PRICE_DESC in-memory', async () => {
      const cheap = mkCpuProduct({ prices: [{ amount: 299.99, isActive: true, priceType: 'RETAIL' }] });
      const expensive = mkCpuProduct({ id: 'cpu-2', prices: [{ amount: 899.99, isActive: true, priceType: 'RETAIL' }] });

      mockDb.product.findMany.mockResolvedValue([cheap, expensive]);
      mockDb.product.count.mockResolvedValue(2);

      const res = await request(app.getHttpServer())
        .get('/products?sortBy=price_desc')
        .expect(200);

      expect(res.body.data[0].price.amount).toBe(899.99);
      expect(res.body.data[1].price.amount).toBe(299.99);
    });

    it('should apply price range filter to DB where clause', async () => {
      mockDb.product.findMany.mockResolvedValue([mkCpuProduct()]);
      mockDb.product.count.mockResolvedValue(1);

      await request(app.getHttpServer())
        .get('/products?minPrice=300&maxPrice=500')
        .expect(200);

      expect(mockDb.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            prices: {
              some: expect.objectContaining({
                amount: { gte: 300, lte: 500 },
              }),
            },
          }),
        }),
      );
    });

    it('should apply inStock filter to DB where clause', async () => {
      mockDb.product.findMany.mockResolvedValue([mkCpuProduct()]);
      mockDb.product.count.mockResolvedValue(1);

      await request(app.getHttpServer())
        .get('/products?inStock=true')
        .expect(200);

      expect(mockDb.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            inventory: { some: { quantity: { gt: 0 } } },
          }),
        }),
      );
    });

    it('should apply brand slug filter to DB where clause', async () => {
      mockDb.product.findMany.mockResolvedValue([mkCpuProduct()]);
      mockDb.product.count.mockResolvedValue(1);

      await request(app.getHttpServer())
        .get('/products?brandSlug=amd&search=ryzen')
        .expect(200);

      expect(mockDb.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            brand: { slug: { equals: 'amd', mode: 'insensitive' } },
            OR: expect.arrayContaining([
              { name: { contains: 'ryzen', mode: 'insensitive' } },
            ]),
          }),
        }),
      );
    });

    // ── CPU Hardware Filters ──────────────────────────────────────────────────

    it('should apply CPU hardware-specific filters to DB query', async () => {
      mockDb.product.findMany.mockResolvedValue([mkCpuProduct()]);
      mockDb.product.count.mockResolvedValue(1);

      await request(app.getHttpServer())
        .get('/products?componentType=CPU&cpuSocket=AM5&minCores=8&maxCores=16&minBaseClockMhz=4000&minBoostClockMhz=4800')
        .expect(200);

      expect(mockDb.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            componentType: 'CPU',
            cpuSpec: expect.objectContaining({
              socketType: { equals: 'AM5', mode: 'insensitive' },
              cores: { gte: 8, lte: 16 },
              baseClockMhz: { gte: 4000 },
              boostClockMhz: { gte: 4800 },
            }),
          }),
        }),
      );
    });

    it('should apply CPU thread range filter', async () => {
      mockDb.product.findMany.mockResolvedValue([mkCpuProduct()]);
      mockDb.product.count.mockResolvedValue(1);

      await request(app.getHttpServer())
        .get('/products?componentType=CPU&minThreads=8&maxThreads=32')
        .expect(200);

      expect(mockDb.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            cpuSpec: expect.objectContaining({
              threads: { gte: 8, lte: 32 },
            }),
          }),
        }),
      );
    });

    // ── GPU Hardware Filters ──────────────────────────────────────────────────

    it('should apply GPU hardware-specific filters to DB query', async () => {
      mockDb.product.findMany.mockResolvedValue([mkGpuProduct()]);
      mockDb.product.count.mockResolvedValue(1);

      await request(app.getHttpServer())
        .get('/products?componentType=GPU&gpuChipset=AD103&minVramGb=16&maxGpuLengthMm=360&maxTdpW=350')
        .expect(200);

      expect(mockDb.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            componentType: 'GPU',
            gpuSpec: expect.objectContaining({
              chipset: { contains: 'AD103', mode: 'insensitive' },
              vramGb: { gte: 16 },
              lengthMm: { lte: 360 },
              tdpW: { lte: 350 },
            }),
          }),
        }),
      );
    });

    it('should apply GPU manufacturer filter as brand name search', async () => {
      mockDb.product.findMany.mockResolvedValue([mkGpuProduct()]);
      mockDb.product.count.mockResolvedValue(1);

      await request(app.getHttpServer())
        .get('/products?componentType=GPU&gpuManufacturer=ASUS')
        .expect(200);

      expect(mockDb.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            brand: { name: { contains: 'ASUS', mode: 'insensitive' } },
          }),
        }),
      );
    });

    it('should apply VRAM range filter (max only)', async () => {
      mockDb.product.findMany.mockResolvedValue([mkGpuProduct()]);
      mockDb.product.count.mockResolvedValue(1);

      await request(app.getHttpServer())
        .get('/products?componentType=GPU&maxVramGb=24')
        .expect(200);

      expect(mockDb.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            gpuSpec: expect.objectContaining({
              vramGb: { lte: 24 },
            }),
          }),
        }),
      );
    });

    // ── Motherboard Hardware Filters ──────────────────────────────────────────

    it('should apply motherboard hardware-specific filters to DB query', async () => {
      mockDb.product.findMany.mockResolvedValue([]);
      mockDb.product.count.mockResolvedValue(0);

      await request(app.getHttpServer())
        .get('/products?componentType=MOTHERBOARD&mbSocket=AM5&mbChipset=X670E&mbRamType=DDR5&minRamSlots=4&mbFormFactor=ATX')
        .expect(200);

      expect(mockDb.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            componentType: 'MOTHERBOARD',
            motherboardSpec: expect.objectContaining({
              socketType: { equals: 'AM5', mode: 'insensitive' },
              chipset: { contains: 'X670E', mode: 'insensitive' },
              supportedMemTypes: { has: 'DDR5' },
              ramSlots: { gte: 4 },
              formFactor: { equals: 'ATX', mode: 'insensitive' },
            }),
          }),
        }),
      );
    });

    // ── RAM Hardware Filters ──────────────────────────────────────────────────

    it('should apply RAM hardware-specific filters to DB query', async () => {
      mockDb.product.findMany.mockResolvedValue([]);
      mockDb.product.count.mockResolvedValue(0);

      await request(app.getHttpServer())
        .get('/products?componentType=RAM&ramMemType=DDR5&ramCapacityGb=32&minRamSpeedMhz=6000&ramStickCount=2')
        .expect(200);

      expect(mockDb.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            componentType: 'RAM',
            ramSpec: expect.objectContaining({
              memType: { equals: 'DDR5', mode: 'insensitive' },
              totalCapacityGb: 32,
              speedMhz: { gte: 6000 },
              stickCount: 2,
            }),
          }),
        }),
      );
    });

    // ── Storage Hardware Filters ──────────────────────────────────────────────

    it('should apply storage hardware-specific filters to DB query', async () => {
      mockDb.product.findMany.mockResolvedValue([]);
      mockDb.product.count.mockResolvedValue(0);

      await request(app.getHttpServer())
        .get('/products?componentType=STORAGE&storageInterface=PCIe+4.0+x4&storageCapacityGb=2000&storageFormFactor=M.2')
        .expect(200);

      expect(mockDb.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            componentType: 'STORAGE',
            storageSpec: expect.objectContaining({
              interface: { contains: 'PCIe 4.0 x4', mode: 'insensitive' },
              capacityGb: 2000,
              formFactor: { contains: 'M.2', mode: 'insensitive' },
            }),
          }),
        }),
      );
    });

    // ── PSU Hardware Filters ──────────────────────────────────────────────────

    it('should apply PSU hardware-specific filters to DB query', async () => {
      mockDb.product.findMany.mockResolvedValue([]);
      mockDb.product.count.mockResolvedValue(0);

      await request(app.getHttpServer())
        .get('/products?componentType=PSU&minWattage=750&maxWattage=1000&psuEfficiency=Gold&psuModularity=Full')
        .expect(200);

      expect(mockDb.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            componentType: 'PSU',
            psuSpec: expect.objectContaining({
              wattage: { gte: 750, lte: 1000 },
              efficiencyRating: { contains: 'Gold', mode: 'insensitive' },
              modular: { equals: 'Full', mode: 'insensitive' },
            }),
          }),
        }),
      );
    });

    it('should apply PSU minimum wattage only filter', async () => {
      mockDb.product.findMany.mockResolvedValue([]);
      mockDb.product.count.mockResolvedValue(0);

      await request(app.getHttpServer())
        .get('/products?componentType=PSU&minWattage=850')
        .expect(200);

      expect(mockDb.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            psuSpec: expect.objectContaining({
              wattage: { gte: 850 },
            }),
          }),
        }),
      );
    });

    // ── Case Hardware Filters ─────────────────────────────────────────────────

    it('should apply case hardware-specific filters to DB query', async () => {
      mockDb.product.findMany.mockResolvedValue([]);
      mockDb.product.count.mockResolvedValue(0);

      await request(app.getHttpServer())
        .get('/products?componentType=CASE&caseMbFormFactor=ATX&minSupportedGpuLengthMm=380&minSupportedCoolerHeightMm=160')
        .expect(200);

      expect(mockDb.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            componentType: 'CASE',
            caseSpec: expect.objectContaining({
              supportedFormFactors: { has: 'ATX' },
              maxGpuLengthMm: { gte: 380 },
              maxCpuCoolerHeightMm: { gte: 160 },
            }),
          }),
        }),
      );
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // GET /products/compare — Product Comparison Engine
  // ═══════════════════════════════════════════════════════════════════════════

  describe('GET /products/compare (Product Comparison)', () => {
    const cpu2 = mkCpuProduct({
      id: 'cpu-2',
      name: 'Intel Core i7-14700K',
      cpuSpec: {
        id: 'spec-cpu-2',
        productId: 'cpu-2',
        socketType: 'LGA1700',
        cores: 20,
        threads: 28,
        baseClockMhz: 3400,
        boostClockMhz: 5600,
        tdpW: 125,
        memoryType: 'DDR5',
        maxMemoryGb: 128,
      },
    });

    it('should return side-by-side comparison with difference detection', async () => {
      mockDb.product.findMany.mockResolvedValue([mkCpuProduct(), cpu2]);

      const res = await request(app.getHttpServer())
        .get('/products/compare?ids=cpu-prod-1,cpu-2')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.products).toHaveLength(2);
      expect(res.body.data.isSameComponentType).toBe(true);
      expect(res.body.data.allSpecKeys).toContain('cores');
      expect(res.body.data.allSpecKeys).toContain('socketType');
      expect(res.body.data.differenceKeys).toContain('cores');
      expect(res.body.data.differenceKeys).toContain('socketType');
    });

    it('should detect no differences when all specs are identical', async () => {
      const identical2 = mkCpuProduct({ id: 'cpu-identical' });
      mockDb.product.findMany.mockResolvedValue([mkCpuProduct(), identical2]);

      const res = await request(app.getHttpServer())
        .get('/products/compare?ids=cpu-prod-1,cpu-identical')
        .expect(200);

      expect(res.body.data.differenceKeys).toHaveLength(0);
    });

    it('should flag isSameComponentType=false when mixing CPU and GPU', async () => {
      mockDb.product.findMany.mockResolvedValue([mkCpuProduct(), mkGpuProduct()]);

      const res = await request(app.getHttpServer())
        .get('/products/compare?ids=cpu-prod-1,gpu-prod-1')
        .expect(200);

      expect(res.body.data.isSameComponentType).toBe(false);
    });

    it('should return 400 Bad Request when only 1 ID is provided', async () => {
      const res = await request(app.getHttpServer())
        .get('/products/compare?ids=single-id')
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should return 400 Bad Request when more than 5 IDs are provided', async () => {
      const res = await request(app.getHttpServer())
        .get('/products/compare?ids=p1,p2,p3,p4,p5,p6')
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should return 404 when a requested product does not exist', async () => {
      mockDb.product.findMany.mockResolvedValue([mkCpuProduct()]);

      const res = await request(app.getHttpServer())
        .get('/products/compare?ids=cpu-prod-1,nonexistent-id')
        .expect(404);

      expect(res.body.success).toBe(false);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // GET /products/:id and /products/slug/:slug
  // ═══════════════════════════════════════════════════════════════════════════

  describe('GET /products/:id and /products/slug/:slug', () => {
    it('should return single product by ID with full enrichment', async () => {
      mockDb.product.findFirst.mockResolvedValue(mkCpuProduct());

      const res = await request(app.getHttpServer())
        .get('/products/cpu-prod-1')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe('cpu-prod-1');
      expect(res.body.data.specifications.socketType).toBe('AM5');
      expect(res.body.data.specifications.cores).toBe(8);
      expect(res.body.data.brand.slug).toBe('amd');
      expect(res.body.data.primaryCategory.slug).toBe('processors');
    });

    it('should expose inventory details on single product', async () => {
      mockDb.product.findFirst.mockResolvedValue(mkCpuProduct());

      const res = await request(app.getHttpServer())
        .get('/products/cpu-prod-1')
        .expect(200);

      expect(res.body.data.inventory.totalQuantity).toBe(25);
      expect(res.body.data.inventory.reservedQuantity).toBe(5);
      expect(res.body.data.inventory.availableQuantity).toBe(20);
      expect(res.body.data.inventory.stockStatus).toBe('IN_STOCK');
    });

    it('should return 404 for nonexistent product ID', async () => {
      mockDb.product.findFirst.mockResolvedValue(null);

      const res = await request(app.getHttpServer())
        .get('/products/non-existent-id')
        .expect(404);

      expect(res.body.success).toBe(false);
    });

    it('should return product by slug', async () => {
      mockDb.product.findFirst.mockResolvedValue(mkCpuProduct());

      const res = await request(app.getHttpServer())
        .get('/products/slug/amd-ryzen-7-7800x3d')
        .expect(200);

      expect(res.body.data.slug).toBe('amd-ryzen-7-7800x3d');
    });

    it('should return 404 for nonexistent slug', async () => {
      mockDb.product.findFirst.mockResolvedValue(null);

      await request(app.getHttpServer())
        .get('/products/slug/does-not-exist')
        .expect(404);
    });

    it('should return LOW_STOCK status when 1-5 units available', async () => {
      const lowStockProduct = mkCpuProduct({
        inventory: [{ id: 'inv-low', quantity: 3, reservedQty: 0 }],
      });
      mockDb.product.findFirst.mockResolvedValue(lowStockProduct);

      const res = await request(app.getHttpServer())
        .get('/products/cpu-prod-1')
        .expect(200);

      expect(res.body.data.inventory.stockStatus).toBe('LOW_STOCK');
      expect(res.body.data.inventory.inStock).toBe(true);
    });

    it('should return OUT_OF_STOCK when quantity equals reservedQty', async () => {
      const outOfStockProduct = mkCpuProduct({
        inventory: [{ id: 'inv-oos', quantity: 5, reservedQty: 5 }],
      });
      mockDb.product.findFirst.mockResolvedValue(outOfStockProduct);

      const res = await request(app.getHttpServer())
        .get('/products/cpu-prod-1')
        .expect(200);

      expect(res.body.data.inventory.stockStatus).toBe('OUT_OF_STOCK');
      expect(res.body.data.inventory.inStock).toBe(false);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Product Lifecycle Management — Create / Update / Publish / Archive / Delete
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Product Lifecycle Management', () => {
    it('POST /products should create product and return 201', async () => {
      mockDb.product.findFirst.mockResolvedValue(null); // slug not taken
      mockDb.product.create.mockResolvedValue(mkCpuProduct());

      const res = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'AMD Ryzen 7 7800X3D',
          description: '8-core gaming processor',
          componentType: 'CPU',
          brandId: 'brand-amd',
          basePrice: 449.99,
          compareAtPrice: 499.99,
          initialStock: 25,
          tags: ['gaming', 'am5'],
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('AMD Ryzen 7 7800X3D');
      expect(mockDb.product.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'AMD Ryzen 7 7800X3D',
            slug: 'amd-ryzen-7-7800x3d',
            componentType: 'CPU',
          }),
        }),
      );
    });

    it('POST /products should return 400 if required fields are missing', async () => {
      const res = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'CPU without price' })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('PATCH /products/:id should update product and return 200', async () => {
      mockDb.product.findFirst
        .mockResolvedValueOnce(mkCpuProduct()) // findById
        .mockResolvedValueOnce(null); // findBySlug (new slug not taken)
      mockDb.price.findFirst.mockResolvedValue(null);
      mockDb.product.update.mockResolvedValue(
        mkCpuProduct({ name: 'AMD Ryzen 7 7800X3D V2' }),
      );

      const res = await request(app.getHttpServer())
        .patch('/products/cpu-prod-1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'AMD Ryzen 7 7800X3D V2', basePrice: 429.99 })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('AMD Ryzen 7 7800X3D V2');
    });

    it('PATCH /products/:id should return 404 for nonexistent product', async () => {
      mockDb.product.findFirst.mockResolvedValue(null);

      await request(app.getHttpServer())
        .patch('/products/nonexistent')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Updated' })
        .expect(404);
    });

    it('PATCH /products/:id/publish should activate product', async () => {
      mockDb.product.findFirst.mockResolvedValue(mkCpuProduct({ isDraft: true }));
      mockDb.product.update.mockResolvedValue(mkCpuProduct({ isActive: true, isDraft: false }));

      const res = await request(app.getHttpServer())
        .patch('/products/cpu-prod-1/publish')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.isActive).toBe(true);
      expect(res.body.data.isDraft).toBe(false);
    });

    it('PATCH /products/:id/publish should return 400 if product has no active prices', async () => {
      const noPriceProduct = mkCpuProduct({ prices: [] });
      mockDb.product.findFirst.mockResolvedValue(noPriceProduct);

      const res = await request(app.getHttpServer())
        .patch('/products/cpu-prod-1/publish')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('PATCH /products/:id/archive should deactivate product', async () => {
      mockDb.product.findFirst.mockResolvedValue(mkCpuProduct());
      mockDb.product.update.mockResolvedValue(mkCpuProduct({ isActive: false }));

      const res = await request(app.getHttpServer())
        .patch('/products/cpu-prod-1/archive')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.isActive).toBe(false);
    });

    it('DELETE /products/:id should soft-delete and return success message', async () => {
      mockDb.product.findFirst.mockResolvedValue(mkCpuProduct());
      mockDb.product.update.mockResolvedValue({});

      const res = await request(app.getHttpServer())
        .delete('/products/cpu-prod-1')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.message).toBe('Product archived successfully');
      expect(mockDb.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'cpu-prod-1' },
          data: expect.objectContaining({ deletedAt: expect.any(Date), isActive: false }),
        }),
      );
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Variant Sub-resource Management
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Product Variant Management', () => {
    const mockVariant = {
      id: 'var-1',
      productId: 'cpu-prod-1',
      name: 'Arctic White',
      sku: 'CPU-WHT',
      attributes: { color: 'White' },
      isActive: true,
      sortOrder: 0,
      prices: [],
      inventory: [],
    };

    it('POST /products/:id/variants should add variant', async () => {
      mockDb.product.findFirst.mockResolvedValue(mkCpuProduct());
      mockDb.productVariant.create.mockResolvedValue(mockVariant);

      const res = await request(app.getHttpServer())
        .post('/products/cpu-prod-1/variants')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Arctic White', sku: 'CPU-WHT', price: 459.99 })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe('var-1');
    });

    it('POST /products/:id/variants should return 400 if SKU is missing', async () => {
      const res = await request(app.getHttpServer())
        .post('/products/cpu-prod-1/variants')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Arctic White' }) // missing sku
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('PATCH /products/:id/variants/:variantId should update variant', async () => {
      mockDb.product.findFirst.mockResolvedValue(mkCpuProduct());
      mockDb.price.findFirst.mockResolvedValue(null);
      mockDb.productVariant.update.mockResolvedValue({ ...mockVariant, name: 'Midnight Black' });

      const res = await request(app.getHttpServer())
        .patch('/products/cpu-prod-1/variants/var-1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Midnight Black', price: 469.99 })
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('DELETE /products/:id/variants/:variantId should remove variant', async () => {
      mockDb.product.findFirst.mockResolvedValue(mkCpuProduct());
      mockDb.productVariant.update.mockResolvedValue({ id: 'var-1', isActive: false });

      const res = await request(app.getHttpServer())
        .delete('/products/cpu-prod-1/variants/var-1')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.message).toBe('Variant removed successfully');
    });

    it('POST /products/:id/variants should return 404 for nonexistent product', async () => {
      mockDb.product.findFirst.mockResolvedValue(null);

      await request(app.getHttpServer())
        .post('/products/nonexistent/variants')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Variant', sku: 'V1' })
        .expect(404);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Image Sub-resource Management
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Product Image Management', () => {
    const mockImage = {
      id: 'img-new-1',
      productId: 'cpu-prod-1',
      url: 'https://cdn.example.com/cpu-side.jpg',
      altText: 'CPU side view',
      isPrimary: false,
      sortOrder: 1,
    };

    it('POST /products/:id/images should add image to gallery', async () => {
      mockDb.product.findFirst.mockResolvedValue(mkCpuProduct());
      mockDb.productImage.updateMany.mockResolvedValue({ count: 0 });
      mockDb.productImage.create.mockResolvedValue(mockImage);

      const res = await request(app.getHttpServer())
        .post('/products/cpu-prod-1/images')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ url: 'https://cdn.example.com/cpu-side.jpg', altText: 'CPU side view' })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe('img-new-1');
    });

    it('POST /products/:id/images should set other images non-primary when isPrimary=true', async () => {
      mockDb.product.findFirst.mockResolvedValue(mkCpuProduct());
      mockDb.productImage.updateMany.mockResolvedValue({ count: 1 });
      mockDb.productImage.create.mockResolvedValue({ ...mockImage, isPrimary: true });

      await request(app.getHttpServer())
        .post('/products/cpu-prod-1/images')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ url: 'https://cdn.example.com/cpu-new-primary.jpg', isPrimary: true })
        .expect(201);

      expect(mockDb.productImage.updateMany).toHaveBeenCalledWith({
        where: { productId: 'cpu-prod-1' },
        data: { isPrimary: false },
      });
    });

    it('DELETE /products/:id/images/:imageId should delete image', async () => {
      mockDb.product.findFirst.mockResolvedValue(mkCpuProduct());
      mockDb.productImage.delete.mockResolvedValue(mockImage);

      const res = await request(app.getHttpServer())
        .delete('/products/cpu-prod-1/images/img-cpu-1')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.message).toBe('Image deleted successfully');
    });

    it('PATCH /products/:id/images/:imageId/primary should promote image to primary', async () => {
      mockDb.product.findFirst.mockResolvedValue(mkCpuProduct());
      mockDb.productImage.updateMany.mockResolvedValue({ count: 1 });
      mockDb.productImage.update.mockResolvedValue({ ...mockImage, isPrimary: true });

      const res = await request(app.getHttpServer())
        .patch('/products/cpu-prod-1/images/img-new-1/primary')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(mockDb.productImage.updateMany).toHaveBeenCalledWith({
        where: { productId: 'cpu-prod-1' },
        data: { isPrimary: false },
      });
      expect(mockDb.productImage.update).toHaveBeenCalledWith({
        where: { id: 'img-new-1', productId: 'cpu-prod-1' },
        data: { isPrimary: true },
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Component Specification Upsert
  // ═══════════════════════════════════════════════════════════════════════════

  describe('PUT /products/:id/specifications/:componentType', () => {
    it('should upsert CPU specification data', async () => {
      const upsertedSpec = {
        id: 'spec-cpu-1',
        productId: 'cpu-prod-1',
        socketType: 'AM5',
        cores: 8,
        threads: 16,
        baseClockMhz: 4200,
        boostClockMhz: 5000,
        tdpW: 120,
        memoryType: 'DDR5',
        maxMemoryGb: 128,
      };
      mockDb.product.findFirst.mockResolvedValue(mkCpuProduct());
      mockDb.cpuSpec.upsert.mockResolvedValue(upsertedSpec);

      const res = await request(app.getHttpServer())
        .put('/products/cpu-prod-1/specifications/CPU')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          socketType: 'AM5',
          cores: 8,
          threads: 16,
          baseClockMhz: 4200,
          boostClockMhz: 5000,
          tdpW: 120,
          memoryType: 'DDR5',
          maxMemoryGb: 128,
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.socketType).toBe('AM5');
      expect(mockDb.cpuSpec.upsert).toHaveBeenCalledWith({
        where: { productId: 'cpu-prod-1' },
        create: expect.objectContaining({ productId: 'cpu-prod-1', socketType: 'AM5' }),
        update: expect.objectContaining({ socketType: 'AM5' }),
      });
    });

    it('should upsert GPU specification data', async () => {
      const upsertedSpec = { id: 'spec-gpu-1', productId: 'gpu-prod-1', chipset: 'AD103', vramGb: 16 };
      mockDb.product.findFirst.mockResolvedValue(mkGpuProduct());
      mockDb.gpuSpec.upsert.mockResolvedValue(upsertedSpec);

      const res = await request(app.getHttpServer())
        .put('/products/gpu-prod-1/specifications/GPU')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ chipset: 'AD103', vramGb: 16, vramType: 'GDDR6X', vramBusBit: 256, tdpW: 320, lengthMm: 357, powerConnectors: '1x 16-pin' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(mockDb.gpuSpec.upsert).toHaveBeenCalled();
    });

    it('should upsert Motherboard specification data', async () => {
      mockDb.product.findFirst.mockResolvedValue(mkCpuProduct());
      mockDb.motherboardSpec.upsert.mockResolvedValue({ id: 'spec-mb-1' });

      await request(app.getHttpServer())
        .put('/products/cpu-prod-1/specifications/MOTHERBOARD')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          socketType: 'AM5',
          chipset: 'X670E',
          formFactor: 'ATX',
          supportedMemTypes: ['DDR5'],
          ramSlots: 4,
          maxRamGb: 192,
        })
        .expect(200);

      expect(mockDb.motherboardSpec.upsert).toHaveBeenCalled();
    });

    it('should return 404 when product not found for spec upsert', async () => {
      mockDb.product.findFirst.mockResolvedValue(null);

      await request(app.getHttpServer())
        .put('/products/nonexistent/specifications/CPU')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ socketType: 'AM5', cores: 8 })
        .expect(404);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // GET /categories/tree — Hierarchical Category Tree
  // ═══════════════════════════════════════════════════════════════════════════

  describe('GET /categories/tree (Hierarchical Tree)', () => {
    it('should return hierarchical category tree with product counts', async () => {
      const mockTree = [
        {
          id: 'cat-components',
          name: 'PC Components',
          slug: 'pc-components',
          parentId: null,
          description: null,
          imageUrl: null,
          _count: { productCategories: 150 },
          children: [
            {
              id: 'cat-cpu',
              name: 'CPUs',
              slug: 'cpus',
              parentId: 'cat-components',
              description: null,
              imageUrl: null,
              _count: { productCategories: 45 },
              children: [],
            },
            {
              id: 'cat-gpu',
              name: 'Graphics Cards',
              slug: 'graphics-cards',
              parentId: 'cat-components',
              description: null,
              imageUrl: null,
              _count: { productCategories: 32 },
              children: [],
            },
          ],
        },
      ];

      mockDb.category.findMany.mockResolvedValue(mockTree);

      const res = await request(app.getHttpServer())
        .get('/categories/tree')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].name).toBe('PC Components');
      expect(res.body.data[0].productCount).toBe(150);
      expect(res.body.data[0].children).toHaveLength(2);
      expect(res.body.data[0].children[0].productCount).toBe(45);
      expect(res.body.data[0].children[1].name).toBe('Graphics Cards');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // GET /brands — Brand Directory
  // ═══════════════════════════════════════════════════════════════════════════

  describe('GET /brands (Brand directory)', () => {
    it('should return paginated brand listing with product counts', async () => {
      mockDb.brand.findMany.mockResolvedValue([
        {
          id: 'b-1',
          name: 'AMD',
          slug: 'amd',
          description: 'Semiconductor company',
          logoUrl: 'https://logo.com/amd.png',
          websiteUrl: 'https://amd.com',
          isActive: true,
          _count: { products: 32 },
        },
        {
          id: 'b-2',
          name: 'NVIDIA',
          slug: 'nvidia',
          description: 'GPU manufacturer',
          logoUrl: null,
          websiteUrl: 'https://nvidia.com',
          isActive: true,
          _count: { products: 28 },
        },
      ]);
      mockDb.brand.count.mockResolvedValue(2);

      const res = await request(app.getHttpServer())
        .get('/brands')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0].name).toBe('AMD');
      expect(res.body.data[0].productCount).toBe(32);
      expect(res.body.data[1].name).toBe('NVIDIA');
      expect(res.body.meta.total).toBe(2);
    });
  });
});

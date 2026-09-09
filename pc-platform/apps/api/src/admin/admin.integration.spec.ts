import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import * as crypto from 'crypto';
import { Reflector } from '@nestjs/core';
import { AdminModule } from './admin.module';
import { DatabaseService } from '@pc-platform/database';
import { DatabaseModule } from '../database/database.module';
import { CacheModule } from '../common/cache/cache.module';
import { CacheService } from '../common/cache/cache.service';
import { AllExceptionsFilter } from '../common/filters/all-exceptions.filter';
import { ResponseTransformInterceptor } from '../common/interceptors/response-transform.interceptor';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from '../auth/strategies/jwt.strategy';
import { ConfigModule } from '@nestjs/config';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

const TEST_JWT_SECRET = 'super-secret-jwt-token-key-for-pc-platform-dev-environment-12345';

function signToken(roles: string[] = ['admin'], sub: string = 'admin-user-1', email: string = 'admin@pcplatform.com'): string {
  const b64url = (obj: object) =>
    Buffer.from(JSON.stringify(obj))
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

  const header = b64url({ alg: 'HS256', typ: 'JWT' });
  const payload = b64url({
    sub,
    email,
    roles,
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

describe('Admin API Integration Tests', () => {
  let app: INestApplication;
  let mockDb: any;
  let adminToken: string;
  let customerToken: string;
  let cacheService: CacheService;

  beforeAll(async () => {
    const mockInventory = {
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      findUnique: jest.fn().mockResolvedValue(null),
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    };

    mockDb = {
      $transaction: jest.fn().mockImplementation((fn: any) =>
        typeof fn === 'function' ? fn(mockDb) : Promise.all(fn)
      ),
      auditLog: {
        create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: `audit-${Date.now()}`, ...data, createdAt: new Date(), timestamp: new Date() })),
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        findUnique: jest.fn().mockResolvedValue(null),
      },
      product: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        findUnique: jest.fn().mockResolvedValue(null),
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        delete: jest.fn(),
      },
      productCategory: {
        count: jest.fn().mockResolvedValue(0),
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
        createMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      category: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        findUnique: jest.fn().mockResolvedValue(null),
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      brand: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        findUnique: jest.fn().mockResolvedValue(null),
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      inventory: mockInventory,
      inventoryItem: mockInventory,
      inventoryReservation: {
        findMany: jest.fn().mockResolvedValue([]),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      supplier: {
        findFirst: jest.fn().mockResolvedValue({ id: 'supp-1', code: 'PLATFORM-WH', isPlatform: true }),
        create: jest.fn().mockResolvedValue({ id: 'supp-1', code: 'PLATFORM-WH', isPlatform: true }),
      },
      price: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn().mockResolvedValue(null),
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      priceHistory: {
        create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: `ph-${Date.now()}`, ...data })),
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
      compatibilityRule: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      compatibilityRuleCondition: {
        create: jest.fn(),
        delete: jest.fn(),
      },
      buildTemplate: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      coupon: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        delete: jest.fn(),
      },
      order: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        findUnique: jest.fn().mockResolvedValue(null),
        findFirst: jest.fn().mockResolvedValue(null),
        update: jest.fn(),
        aggregate: jest.fn().mockResolvedValue({ _sum: { total: 50000 }, _count: { id: 100 } }),
      },
      orderItem: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
      shipment: {
        create: jest.fn(),
      },
      user: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        findUnique: jest.fn().mockResolvedValue(null),
        update: jest.fn(),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        delete: jest.fn(),
      },
      userRole: {
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
        createMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      role: {
        findMany: jest.fn().mockResolvedValue([
          { id: 'role-admin', name: 'admin' },
          { id: 'role-customer', name: 'customer' },
        ]),
      },
      review: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        findUnique: jest.fn().mockResolvedValue(null),
        update: jest.fn(),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        delete: jest.fn(),
      },
      banner: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      homepageSection: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      productImage: {
        create: jest.fn(),
        updateMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      productVariant: {
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
      peripheralSpec: { upsert: jest.fn() },
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        CacheModule,
        DatabaseModule,
        ConfigModule.forRoot({ isGlobal: true }),
        PassportModule,
        JwtModule.register({
          secret: TEST_JWT_SECRET,
          signOptions: { expiresIn: '1h' },
        }),
        AdminModule,
      ],
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

    const reflector = moduleFixture.get(Reflector);
    app.useGlobalGuards(new JwtAuthGuard(reflector));
    await app.init();

    adminToken = signToken(['admin']);
    customerToken = signToken(['customer']);
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
    mockDb.supplier.findFirst.mockResolvedValue({ id: 'supp-1', code: 'PLATFORM-WH', isPlatform: true });
    mockDb.productCategory.count.mockResolvedValue(0);
    mockDb.category.count.mockResolvedValue(0);
    mockDb.product.count.mockResolvedValue(0);
    mockDb.orderItem.count.mockResolvedValue(0);
    mockDb.order.aggregate.mockResolvedValue({ _sum: { total: 50000 }, _count: { id: 100 } });
    mockDb.inventory.findMany.mockResolvedValue([]);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. RBAC SECURITY
  // ═══════════════════════════════════════════════════════════════════════════
  describe('RBAC Security & Authorization', () => {
    it('should reject requests without authorization token (401)', async () => {
      const res = await request(app.getHttpServer()).get('/admin/dashboard');
      expect(res.status).toBe(401);
    });

    it('should reject non-admin users (403)', async () => {
      const res = await request(app.getHttpServer())
        .get('/admin/dashboard')
        .set('Authorization', `Bearer ${customerToken}`);
      expect(res.status).toBe(403);
    });

    it('should allow authorized admin users (200)', async () => {
      mockDb.order.aggregate.mockResolvedValue({ _sum: { total: 1000 }, _count: { id: 5 } });
      mockDb.order.count.mockResolvedValue(5);
      mockDb.product.count.mockResolvedValue(10);
      mockDb.user.count.mockResolvedValue(20);
      mockDb.inventory.findMany.mockResolvedValue([]);
      mockDb.review.count.mockResolvedValue(2);
      mockDb.auditLog.count.mockResolvedValue(50);
      mockDb.auditLog.findMany.mockResolvedValue([]);
      mockDb.order.findMany.mockResolvedValue([]);

      const res = await request(app.getHttpServer())
        .get('/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('revenue');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. AUDIT LOGGING & MUTATIONS
  // ═══════════════════════════════════════════════════════════════════════════
  describe('Audit Logging Verification', () => {
    it('should record an audit log with actor and details on every admin mutation', async () => {
      const mockCreatedBrand = {
        id: 'brand-corsair',
        name: 'Corsair',
        slug: 'corsair',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockDb.brand.findUnique.mockResolvedValue(null);
      mockDb.brand.create.mockResolvedValue(mockCreatedBrand);

      const res = await request(app.getHttpServer())
        .post('/admin/brands')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Corsair',
          countryCode: 'US',
          websiteUrl: 'https://corsair.com',
        });

      expect(res.status).toBe(201);
      expect(mockDb.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            actorId: 'admin-user-1',
            actorEmail: 'admin@pcplatform.com',
            action: 'CREATE',
            entityType: 'Brand',
            entityId: 'brand-corsair',
            entityLabel: 'Corsair',
          }),
        }),
      );
    });

    it('should query audit logs with pagination and filters', async () => {
      mockDb.auditLog.findMany.mockResolvedValue([
        {
          id: 'log-1',
          actorId: 'admin-user-1',
          actorEmail: 'admin@pcplatform.com',
          action: 'CREATE',
          entityType: 'Product',
          entityId: 'prod-1',
          createdAt: new Date(),
          timestamp: new Date(),
        },
      ]);
      mockDb.auditLog.count.mockResolvedValue(1);

      const res = await request(app.getHttpServer())
        .get('/admin/audit-logs')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.meta.total).toBe(1);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. OPTIMISTIC CONCURRENCY CONTROL
  // ═══════════════════════════════════════════════════════════════════════════
  describe('Optimistic Concurrency Control (OCC)', () => {
    it('should return 409 Conflict if expectedUpdatedAt does not match DB updatedAt', async () => {
      const existingProduct = {
        id: 'prod-cpu-1',
        name: 'Ryzen 7 7800X3D',
        slug: 'ryzen-7-7800x3d',
        updatedAt: new Date('2026-02-01T12:00:00Z'),
      };
      mockDb.product.findUnique.mockResolvedValue(existingProduct);

      const res = await request(app.getHttpServer())
        .patch('/admin/products/prod-cpu-1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Ryzen 7 7800X3D Updated',
          expectedUpdatedAt: '2026-01-01T00:00:00.000Z',
        });

      expect(res.status).toBe(409);
      expect(res.body.message).toContain('modified by another administrator');
    });

    it('should succeed when expectedUpdatedAt matches DB updatedAt', async () => {
      const existingProduct = {
        id: 'prod-cpu-1',
        name: 'Ryzen 7 7800X3D',
        slug: 'ryzen-7-7800x3d',
        updatedAt: new Date('2026-02-01T12:00:00Z'),
        prices: [{ id: 'p1', priceType: 'RETAIL', amount: 449, isActive: true }],
      };
      const updatedProduct = {
        ...existingProduct,
        name: 'Ryzen 7 7800X3D Refresh',
        updatedAt: new Date('2026-02-01T13:00:00Z'),
      };

      mockDb.product.findUnique.mockResolvedValue(existingProduct);
      mockDb.product.update.mockResolvedValue(updatedProduct);

      const res = await request(app.getHttpServer())
        .patch('/admin/products/prod-cpu-1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Ryzen 7 7800X3D Refresh',
          expectedUpdatedAt: '2026-02-01T12:00:00.000Z',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Ryzen 7 7800X3D Refresh');
      expect(mockDb.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'UPDATE',
            entityType: 'Product',
          }),
        }),
      );
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. SAFE DESTRUCTIVE OPERATIONS
  // ═══════════════════════════════════════════════════════════════════════════
  describe('Safe Destructive Operations & Dependency Protection', () => {
    it('should reject deleting a category that has assigned products (400)', async () => {
      mockDb.category.findUnique.mockResolvedValue({
        id: 'cat-cpu',
        name: 'Processors',
      });
      mockDb.productCategory.count.mockResolvedValue(1);

      const res = await request(app.getHttpServer())
        .delete('/admin/categories/cat-cpu')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Cannot delete category "Processors": 1 products are currently assigned to it');
      expect(mockDb.category.delete).not.toHaveBeenCalled();
    });

    it('should reject deleting a category that has subcategories (400)', async () => {
      mockDb.category.findUnique.mockResolvedValue({
        id: 'cat-components',
        name: 'PC Components',
      });
      mockDb.productCategory.count.mockResolvedValue(0);
      mockDb.category.count.mockResolvedValue(1);

      const res = await request(app.getHttpServer())
        .delete('/admin/categories/cat-components')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Cannot delete category "PC Components": 1 subcategories exist');
      expect(mockDb.category.delete).not.toHaveBeenCalled();
    });

    it('should safely delete an empty category and write audit log', async () => {
      mockDb.category.findUnique.mockResolvedValue({
        id: 'cat-empty',
        name: 'Empty Category',
      });
      mockDb.productCategory.count.mockResolvedValue(0);
      mockDb.category.count.mockResolvedValue(0);
      mockDb.category.delete.mockResolvedValue({ id: 'cat-empty', name: 'Empty Category' });

      const res = await request(app.getHttpServer())
        .delete('/admin/categories/cat-empty')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(mockDb.category.delete).toHaveBeenCalledWith({ where: { id: 'cat-empty' } });
      expect(mockDb.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'DELETE',
            entityType: 'Category',
          }),
        }),
      );
    });

    it('should reject deleting a brand that has assigned products (400)', async () => {
      mockDb.brand.findUnique.mockResolvedValue({
        id: 'brand-intel',
        name: 'Intel',
      });
      mockDb.product.count.mockResolvedValue(1);

      const res = await request(app.getHttpServer())
        .delete('/admin/brands/brand-intel')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Cannot delete brand "Intel": 1 products are currently associated with it');
    });

    it('should soft delete a product (deactivating and marking as draft)', async () => {
      const prod = { id: 'prod-to-delete', name: 'Obsolete Part', isActive: true, isDraft: false };
      mockDb.product.findUnique.mockResolvedValue(prod);
      mockDb.orderItem.count.mockResolvedValue(1);
      mockDb.product.update.mockResolvedValue({ ...prod, isActive: false, isDraft: true });

      const res = await request(app.getHttpServer())
        .delete('/admin/products/prod-to-delete')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(mockDb.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'prod-to-delete' },
          data: { isActive: false, isDraft: true },
        }),
      );
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. BULK OPERATIONS
  // ═══════════════════════════════════════════════════════════════════════════
  describe('Bulk Operations', () => {
    it('should execute bulk product status updates', async () => {
      mockDb.product.findUnique.mockResolvedValue({
        id: 'prod-1',
        name: 'Product 1',
        isActive: false,
        prices: [{ id: 'p1', isActive: true, amount: 100 }],
      });
      mockDb.product.update.mockResolvedValue({ id: 'prod-1', isActive: true, isDraft: false });

      const res = await request(app.getHttpServer())
        .post('/admin/products/bulk/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          productIds: ['prod-1', 'prod-2', 'prod-3'],
          action: 'PUBLISH',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.successCount).toBe(3);
      expect(mockDb.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'UPDATE',
            entityType: 'Product',
          }),
        }),
      );
    });

    it('should execute bulk inventory adjustments', async () => {
      const inv1 = { id: 'inv-1', quantity: 10, lowStockThreshold: 5, supplierId: 's1', product: { name: 'P1' } };
      mockDb.inventory.findUnique.mockResolvedValue(inv1);
      mockDb.inventory.findFirst.mockResolvedValue(inv1);
      mockDb.inventory.update.mockResolvedValue({ ...inv1, quantity: 15 });

      const res = await request(app.getHttpServer())
        .post('/admin/inventory/bulk-adjust')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          adjustments: [
            { productId: 'prod-1', quantityDelta: 5, type: 'RESTOCK', reason: 'Batch A' },
            { productId: 'prod-2', quantityDelta: 5, type: 'RESTOCK', reason: 'Batch B' },
          ],
        });

      expect(res.status).toBe(200);
      expect(res.body.data.successCount).toBe(2);
    });

    it('should execute bulk price percentage adjustments and record price history', async () => {
      const price1 = { id: 'pr-1', productId: 'prod-1', amount: 100, currency: 'INR', isActive: true, priceType: 'RETAIL' };
      mockDb.price.findMany.mockResolvedValue([price1]);
      mockDb.price.update.mockResolvedValue({ ...price1, amount: 110 });

      const res = await request(app.getHttpServer())
        .post('/admin/prices/bulk-update')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          productIds: ['prod-1', 'prod-2'],
          adjustmentType: 'PERCENTAGE',
          adjustmentValue: 10,
          reason: 'Supplier cost increase',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.successCount).toBe(2);
      expect(mockDb.priceHistory.create).toHaveBeenCalled();
    });

    it('should execute bulk review moderation', async () => {
      mockDb.review.findUnique.mockResolvedValue({
        id: 'rev-1',
        status: 'PENDING',
        product: { name: 'P1' },
        user: { email: 'test@user.com' },
      });
      mockDb.review.update.mockResolvedValue({ id: 'rev-1', status: 'APPROVED' });

      const res = await request(app.getHttpServer())
        .post('/admin/reviews/bulk/moderate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reviewIds: ['rev-1', 'rev-2', 'rev-3', 'rev-4'],
          status: 'APPROVED',
          moderatorNote: 'Verified purchaser comments',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.successCount).toBe(4);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. DRAFT / PUBLISHED LIFECYCLE
  // ═══════════════════════════════════════════════════════════════════════════
  describe('Draft & Published Lifecycle', () => {
    it('should reject publishing product without an active price (400)', async () => {
      mockDb.product.findUnique.mockResolvedValue({
        id: 'draft-no-price',
        name: 'Unpriced Component',
        prices: [],
      });

      const res = await request(app.getHttpServer())
        .patch('/admin/products/draft-no-price/publish')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('without at least one active price');
    });

    it('should successfully publish product with active price', async () => {
      const product = {
        id: 'draft-with-price',
        name: 'RTX 4090 OC',
        prices: [{ id: 'p1', isActive: true, amount: 1699 }],
      };
      mockDb.product.findUnique.mockResolvedValue(product);
      mockDb.product.update.mockResolvedValue({ ...product, isActive: true, isDraft: false });

      const res = await request(app.getHttpServer())
        .patch('/admin/products/draft-with-price/publish')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(mockDb.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { isActive: true, isDraft: false },
        }),
      );
      expect(mockDb.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'ACTIVATE',
            entityType: 'Product',
          }),
        }),
      );
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 7. COMPATIBILITY RULES & BUILD TEMPLATES
  // ═══════════════════════════════════════════════════════════════════════════
  describe('Compatibility Rules & Build Templates Management', () => {
    it('should author a new compatibility rule with condition definitions', async () => {
      const createdRule = {
        id: 'rule-am5-ddr5',
        name: 'AM5 Requires DDR5 Memory',
        ruleType: 'MEMORY_TYPE_MATCH',
        severity: 'ERROR',
        priority: 10,
        isActive: true,
        conditions: [],
      };
      mockDb.compatibilityRule.findUnique.mockResolvedValue(null);
      mockDb.compatibilityRule.create.mockResolvedValue(createdRule);

      const res = await request(app.getHttpServer())
        .post('/admin/compatibility-rules')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'AM5 Requires DDR5 Memory',
          description: 'AMD Socket AM5 motherboards only support DDR5 memory modules',
          ruleType: 'MEMORY_TYPE_MATCH',
          severity: 'ERROR',
          priority: 10,
          conditions: [
            {
              conditionIndex: 0,
              componentType: 'MOTHERBOARD',
              attributePath: 'motherboardSpec.socketType',
              operator: 'EQUALS',
              value: 'AM5',
              targetComponentType: 'RAM',
              targetAttributePath: 'ramSpec.ddrGeneration',
            },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('AM5 Requires DDR5 Memory');
      expect(mockDb.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'CREATE',
            entityType: 'CompatibilityRule',
          }),
        }),
      );
    });

    it('should create and publish a curated PC build template', async () => {
      const template = {
        id: 'tpl-tier-1',
        name: 'Ultimate 4K Gaming Rig',
        slug: 'ultimate-4k-gaming-rig',
        budgetMin: 2500,
        budgetMax: 3500,
        items: [{ slot: 'CPU', productId: 'cpu-prod-1' }],
        isActive: true,
      };
      mockDb.buildTemplate.findUnique.mockResolvedValue(null);
      mockDb.buildTemplate.create.mockResolvedValue(template);

      const res = await request(app.getHttpServer())
        .post('/admin/build-templates')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Ultimate 4K Gaming Rig',
          description: 'Top tier gaming build configured for high-framerate 4K gaming',
          budgetMin: 2500,
          budgetMax: 3500,
          items: [{ productId: 'cpu-prod-1', componentType: 'CPU', quantity: 1 }],
          isActive: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.slug).toBe('ultimate-4k-gaming-rig');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 8. ORDERS & INVENTORY RELEASE ON CANCELLATION
  // ═══════════════════════════════════════════════════════════════════════════
  describe('Order Operations & Stock Release', () => {
    it('should cancel an order and release reserved stock back to available pool', async () => {
      const order = {
        id: 'ord-12345',
        orderNumber: 'ORD-12345',
        status: 'CONFIRMED',
        items: [{ productId: 'prod-cpu-1', quantity: 2 }],
      };
      mockDb.order.findUnique.mockResolvedValue(order);
      mockDb.order.findFirst.mockResolvedValue(order);
      mockDb.order.update.mockResolvedValue({ ...order, status: 'CANCELLED' });

      const res = await request(app.getHttpServer())
        .post('/admin/orders/ord-12345/cancel')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reason: 'Customer requested cancellation before dispatch',
          restockInventory: true,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('CANCELLED');
      expect(mockDb.inventory.updateMany).toHaveBeenCalled();
      expect(mockDb.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'UPDATE',
            entityType: 'Order',
          }),
        }),
      );
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 9. USER ROLE ASSIGNMENT & STATUS MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════
  describe('User Management & Roles', () => {
    it('should assign roles to a user and record audit log', async () => {
      const targetUser = {
        id: 'usr-mod-1',
        email: 'staff@pcplatform.com',
        userRoles: [{ role: { name: 'customer' } }],
      };
      mockDb.user.findUnique.mockResolvedValue(targetUser);

      const res = await request(app.getHttpServer())
        .patch('/admin/users/usr-mod-1/roles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          roleNames: ['admin', 'customer'],
        });

      expect(res.status).toBe(200);
      expect(mockDb.userRole.deleteMany).toHaveBeenCalledWith({ where: { userId: 'usr-mod-1' } });
      expect(mockDb.userRole.createMany).toHaveBeenCalled();
      expect(mockDb.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'UPDATE',
            entityType: 'User',
          }),
        }),
      );
    });

    it('should update user status to SUSPENDED', async () => {
      const targetUser = { id: 'usr-bad-1', email: 'spammer@example.com', status: 'ACTIVE' };
      mockDb.user.findUnique.mockResolvedValue(targetUser);
      mockDb.user.update.mockResolvedValue({ ...targetUser, status: 'SUSPENDED' });

      const res = await request(app.getHttpServer())
        .patch('/admin/users/usr-bad-1/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'SUSPENDED',
          reason: 'Terms of service violation',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('SUSPENDED');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 10. CMS BANNERS & HOMEPAGE SECTIONS
  // ═══════════════════════════════════════════════════════════════════════════
  describe('CMS Banners & Homepage Configuration', () => {
    it('should create a promo banner', async () => {
      const banner = {
        id: 'banner-summer-sale',
        title: 'Summer Gaming Hardware Sale',
        imageUrl: 'https://images.pcplatform.com/summer-sale.jpg',
        position: 'HERO',
        isActive: true,
        sortOrder: 1,
      };
      mockDb.banner.create.mockResolvedValue(banner);

      const res = await request(app.getHttpServer())
        .post('/admin/banners')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Summer Gaming Hardware Sale',
          subtitle: 'Up to 30% off RTX GPUs & AM5 CPUs',
          imageUrl: 'https://images.pcplatform.com/summer-sale.jpg',
          linkUrl: '/promotions/summer-sale',
          position: 'HERO',
          sortOrder: 1,
          isActive: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.title).toBe('Summer Gaming Hardware Sale');
    });

    it('should configure homepage layout sections', async () => {
      const section = {
        id: 'sec-featured-deals',
        title: 'Hot Deals this Week',
        sectionKey: 'hot_deals',
        type: 'product_grid',
        sortOrder: 1,
        isActive: true,
      };
      mockDb.homepageSection.create.mockResolvedValue(section);

      const res = await request(app.getHttpServer())
        .post('/admin/homepage/sections')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Hot Deals this Week',
          sectionKey: 'hot_deals',
          type: 'product_grid',
          sortOrder: 1,
          isActive: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.title).toBe('Hot Deals this Week');
    });

    it('should set curated featured products', async () => {
      mockDb.product.updateMany.mockResolvedValue({ count: 2 });

      const res = await request(app.getHttpServer())
        .post('/admin/featured-products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          productIds: ['prod-1', 'prod-2'],
        });

      expect(res.status).toBe(200);
      expect(res.body.data.featuredCount).toBe(2);
    });
  });
});

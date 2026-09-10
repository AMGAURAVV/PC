import type { INestApplication} from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { RolesGuard } from '../common/guards/roles.guard';

import { BuildsController } from './builds.controller';
import { BuildsRepository } from './builds.repository';
import { BuildsService } from './builds.service';
import { CompatibilityClientService } from './compatibility-client.service';


describe('Builds API Integration Tests', () => {
  let app: INestApplication;
  let buildsRepo: any;
  let compatClient: any;

  const mockUser = {
    sub: 'user_gamer_1',
    email: 'gamer@nexuspc.in',
    roles: ['CUSTOMER'],
  };

  const otherUser = {
    sub: 'user_other_2',
    email: 'other@nexuspc.in',
    roles: ['CUSTOMER'],
  };

  const mockProductCpu = {
    id: 'd3b07384-d113-4a44-93ff-183cf99f6420',
    name: 'AMD Ryzen 7 7800X3D',
    componentType: 'CPU',
    prices: [{ amount: 3699900 }],
    specifications: { socket: 'AM5', tdp: 120, cores: 8 },
    brand: { name: 'AMD' },
  };

  const mockProductMotherboard = {
    id: 'a1b07384-d113-4a44-93ff-183cf99f6421',
    name: 'MSI MAG B650 TOMAHAWK WIFI',
    componentType: 'MOTHERBOARD',
    prices: [{ amount: 2199900 }],
    specifications: { socket: 'AM5', formFactor: 'ATX', memoryType: 'DDR5' },
    brand: { name: 'MSI' },
  };

  let buildsStore: any[] = [];
  let buildVersionsStore: any[] = [];
  let sharedLinksStore: any[] = [];

  beforeAll(async () => {
    buildsStore = [];
    buildVersionsStore = [];
    sharedLinksStore = [];

    buildsRepo = {
      create: jest.fn(async (userId: string, data: any) => {
        const build = {
          id: `build_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          userId,
          name: data.name,
          description: data.description,
          isPublic: data.isPublic || false,
          status: 'DRAFT',
          items: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        buildsStore.push(build);
        return build;
      }),
      findById: jest.fn(async (id: string) => {
        return buildsStore.find((b) => b.id === id) || null;
      }),
      findAllByUser: jest.fn(async (userId: string) => {
        return buildsStore.filter((b) => b.userId === userId);
      }),
      countAllByUser: jest.fn(async (userId: string) => {
        return buildsStore.filter((b) => b.userId === userId).length;
      }),
      update: jest.fn(async (id: string, data: any) => {
        const build = buildsStore.find((b) => b.id === id);
        if (build) {
          Object.assign(build, data, { updatedAt: new Date() });
        }
        return build;
      }),
      delete: jest.fn(async (id: string) => {
        buildsStore = buildsStore.filter((b) => b.id !== id);
      }),
      addItem: jest.fn(async (data: any) => {
        const build = buildsStore.find((b) => b.id === data.buildId);
        if (build) {
          const item = {
            id: `item_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            ...data,
            product: data.productId === mockProductCpu.id ? mockProductCpu : mockProductMotherboard,
          };
          build.items.push(item);
          return item;
        }
      }),
      findProductWithSpecs: jest.fn(async (productId: string) => {
        if (productId === mockProductCpu.id) return mockProductCpu;
        if (productId === mockProductMotherboard.id) return mockProductMotherboard;
        return null;
      }),
      findProductsByIds: jest.fn(async (ids: string[]) => {
        const list: any[] = [];
        if (ids.includes(mockProductCpu.id)) list.push(mockProductCpu);
        if (ids.includes(mockProductMotherboard.id)) list.push(mockProductMotherboard);
        return list;
      }),
      createVersion: jest.fn(async (data: any) => {
        const v = { id: `ver_${Date.now()}`, ...data, createdAt: new Date() };
        buildVersionsStore.push(v);
        return v;
      }),
      getLatestVersionNumber: jest.fn(async () => 1),
      deactivateAllSharedLinks: jest.fn(async () => {}),
      createSharedLink: jest.fn(async (data: any) => {
        const link = { id: `link_${Date.now()}`, ...data, viewCount: 0, createdAt: new Date() };
        sharedLinksStore.push(link);
        return link;
      }),
      findSharedLinkByToken: jest.fn(async (token: string) => {
        return sharedLinksStore.find((l) => l.token === token) || null;
      }),
      incrementSharedLinkViews: jest.fn(async () => {}),
      updateTotalPrice: jest.fn(async () => {}),
      recalculateTotalPriceCache: jest.fn(async () => {}),
      getMaxSortOrder: jest.fn(async () => 0),
    };

    compatClient = {
      check: jest.fn(() => ({
        status: 'compatible',
        compatible: true,
        issues: [],
        warnings: [],
        summary: 'Authoritative check: all components compatible',
      })),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [BuildsController],
      providers: [
        BuildsService,
        { provide: BuildsRepository, useValue: buildsRepo },
        { provide: CompatibilityClientService, useValue: compatClient },
        { provide: Reflector, useValue: new Reflector() },
      ],
    })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

    // Mock CurrentUser decorator by attaching user to incoming requests
    app.use((req: any, _res: any, next: any) => {
      req.user = req.headers['x-test-user-id'] === otherUser.sub ? otherUser : mockUser;
      next();
    });

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /builds/evaluate (Public Compatibility Check)', () => {
    it('evaluates compatibility and wattage for given components', async () => {
      const response = await request(app.getHttpServer())
        .post('/builds/evaluate')
        .send({
          items: [
            { productId: mockProductCpu.id, quantity: 1 },
            { productId: mockProductMotherboard.id, quantity: 1 },
          ],
        })
        .expect(200);

      expect(response.body).toHaveProperty('totalPrice');
      expect(response.body).toHaveProperty('estimatedPowerW');
      expect(response.body).toHaveProperty('compatibilityStatus', 'compatible');
      expect(response.body.compatibilityResult.compatible).toBe(true);
    });

    it('returns empty evaluation report when no items sent', async () => {
      const response = await request(app.getHttpServer())
        .post('/builds/evaluate')
        .send({ items: [] })
        .expect(200);

      expect(response.body.totalPrice).toBe(0);
      expect(response.body.compatibilityResult.summary).toBe('No components configured.');
    });
  });

  describe('POST /builds, PUT /builds/:id/items, and Build Lifecycle', () => {
    let createdBuildId: string;

    it('creates a new PC build for user', async () => {
      const response = await request(app.getHttpServer())
        .post('/builds')
        .send({
          name: 'Ryzen 7800X3D Gaming Beast',
          description: 'High refresh rate competitive rig',
          isPublic: false,
          items: [{ productId: mockProductCpu.id, quantity: 1 }],
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('Ryzen 7800X3D Gaming Beast');
      createdBuildId = response.body.id;
    });

    it('adds motherboard to the newly created build', async () => {
      const response = await request(app.getHttpServer())
        .post(`/builds/${createdBuildId}/items`)
        .send({
          productId: mockProductMotherboard.id,
          quantity: 1,
        })
        .expect(200);

      expect(response.body.items.length).toBeGreaterThanOrEqual(2);
    });

    it('duplicates build and attributes duplicate to current user', async () => {
      const response = await request(app.getHttpServer())
        .post(`/builds/${createdBuildId}/duplicate`)
        .expect(201);

      expect(response.body.id).not.toBe(createdBuildId);
      expect(response.body.name).toContain('Ryzen 7800X3D Gaming Beast');
      expect(response.body.items).toHaveLength(2);
    });

    it('shares build generating public token link', async () => {
      const response = await request(app.getHttpServer())
        .post(`/builds/${createdBuildId}/share`)
        .send({ label: 'Check my custom rig' })
        .expect(201);

      expect(response.body).toHaveProperty('token');
      expect(response.body.token.length).toBeGreaterThan(6);
      expect(response.body.build.id).toBe(createdBuildId);
    });

    it('prevents IDOR: unauthorized user cannot modify build owned by someone else', async () => {
      await request(app.getHttpServer())
        .patch(`/builds/${createdBuildId}`)
        .set('x-test-user-id', otherUser.sub)
        .send({ name: 'Hacked Build' })
        .expect(403);
    });
  });
});

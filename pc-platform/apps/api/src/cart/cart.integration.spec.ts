import type { INestApplication} from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { RolesGuard } from '../common/guards/roles.guard';

import { CartController } from './cart.controller';
import { CartRepository } from './cart.repository';
import { CartService } from './cart.service';


describe('Cart API Integration Tests', () => {
  let app: INestApplication;
  let cartRepo: any;

  const testUser = {
    sub: 'user_cart_tester',
    email: 'tester@nexuspc.in',
    roles: ['CUSTOMER'],
  };

  const mockProductGpu = {
    id: 'b2b07384-d113-4a44-93ff-183cf99f6422',
    name: 'NVIDIA GeForce RTX 4080 Super',
    prices: [{ amount: 10299900 }], // ₹1,02,999 in paise
    brand: { name: 'NVIDIA' },
    inventory: { quantity: 5 },
  };

  let activeCart: any = null;

  beforeAll(async () => {
    activeCart = {
      id: 'cart_test_active',
      userId: testUser.sub,
      status: 'ACTIVE',
      items: [],
      updatedAt: new Date(),
    };

    cartRepo = {
      findActiveCartByUser: jest.fn(async (userId: string) => {
        if (userId === testUser.sub) return activeCart;
        return null;
      }),
      createCart: jest.fn(async (userId: string) => {
        activeCart = {
          id: `cart_${Date.now()}`,
          userId,
          status: 'ACTIVE',
          items: [],
          updatedAt: new Date(),
        };
        return activeCart;
      }),
      addItemToCart: jest.fn(async (_cartId: string, dto: any) => {
        const item = {
          id: `item_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          productId: dto.productId,
          productVariantId: dto.productVariantId || null,
          quantity: dto.quantity,
          priceAtAdded: 102999,
          product: mockProductGpu,
        };
        activeCart.items.push(item);
        return item;
      }),
      updateItemQuantity: jest.fn(async (itemId: string, quantity: number) => {
        const item = activeCart.items.find((i: any) => i.id === itemId);
        if (item) {
          item.quantity = quantity;
        }
      }),
      removeItem: jest.fn(async (itemId: string) => {
        activeCart.items = activeCart.items.filter((i: any) => i.id !== itemId);
      }),
      clearCart: jest.fn(async () => {
        activeCart.items = [];
      }),
      findBuildWithItems: jest.fn(async (buildId: string) => {
        if (buildId === 'build_public_bundle') {
          return {
            id: 'build_public_bundle',
            userId: testUser.sub,
            isPublic: true,
            items: [{ productId: mockProductGpu.id, quantity: 1 }],
          };
        }
        return null;
      }),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [CartController],
      providers: [
        CartService,
        { provide: CartRepository, useValue: cartRepo },
        { provide: Reflector, useValue: new Reflector() },
      ],
    })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

    app.use((req: any, _res: any, next: any) => {
      req.user = testUser;
      next();
    });

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /cart should return active cart with empty items initially', async () => {
    const res = await request(app.getHttpServer()).get('/cart').expect(200);

    expect(res.body).toHaveProperty('id');
    expect(res.body.items).toHaveLength(0);
  });

  let addedItemId: string;

  it('POST /cart/items should add GPU and return calculated live unitPrice and totalPrice', async () => {
    const res = await request(app.getHttpServer())
      .post('/cart/items')
      .send({
        productId: mockProductGpu.id,
        quantity: 1,
      })
      .expect(201);

    expect(res.body.items).toHaveLength(1);
    const item = res.body.items[0];
    expect(item.productId).toBe(mockProductGpu.id);
    expect(item.quantity).toBe(1);
    expect(item.unitPrice).toBe(102999);
    expect(item.totalPrice).toBe(102999);
    expect(item.inStock).toBe(true);
    addedItemId = item.id;
  });

  it('PATCH /cart/items/:itemId should update item quantity and recalculate totalPrice', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/cart/items/${addedItemId}`)
      .send({ quantity: 2 })
      .expect(200);

    const item = res.body.items.find((i: any) => i.id === addedItemId);
    expect(item.quantity).toBe(2);
    expect(item.totalPrice).toBe(102999 * 2);
  });

  it('POST /cart/bundle/:buildId should bundle an entire PC build into the user cart', async () => {
    const res = await request(app.getHttpServer())
      .post('/cart/bundle/build_public_bundle')
      .expect(201);

    expect(res.body.items.length).toBeGreaterThanOrEqual(1);
  });

  it('DELETE /cart/items/:itemId should remove component item from cart', async () => {
    const res = await request(app.getHttpServer())
      .delete(`/cart/items/${addedItemId}`)
      .expect(200);

    const exists = res.body.items.some((i: any) => i.id === addedItemId);
    expect(exists).toBe(false);
  });

  it('DELETE /cart should clear all items in the shopping cart', async () => {
    const res = await request(app.getHttpServer()).delete('/cart').expect(200);

    expect(res.body).toEqual({ message: 'Cart cleared successfully' });

    const checkRes = await request(app.getHttpServer()).get('/cart').expect(200);
    expect(checkRes.body.items).toHaveLength(0);
  });
});

import type { INestApplication} from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { CompatibilityService } from '@pc-platform/compatibility-engine';
import { DatabaseService, OrderStatus } from '@pc-platform/database';
import request from 'supertest';

import { CartRepository } from '../cart/cart.repository';
import { RolesGuard } from '../common/guards/roles.guard';
import { CouponsService } from '../coupons/coupons.service';
import { PaymentsService } from '../payments/payments.service';

import { OrdersController } from './orders.controller';
import { OrdersRepository } from './orders.repository';
import { OrdersService } from './orders.service';


describe('Orders & Checkout API Integration Tests (Mock Payment Guarantee)', () => {
  let app: INestApplication;
  let mockDb: any;
  let mockPaymentsService: any;
  let mockCouponsService: any;
  let mockOrdersRepo: any;
  let mockCartRepo: any;
  let mockCompatService: any;

  const testUser = {
    sub: 'user_checkout_tester',
    email: 'checkout@nexuspc.in',
    roles: ['CUSTOMER'],
  };

  const mockProductCpu = {
    id: 'd3b07384-d113-4a44-93ff-183cf99f6420',
    name: 'AMD Ryzen 7 7800X3D',
    sku: 'CPU-AMD-7800X3D',
    model: '7800X3D',
    category: 'CPU',
    isActive: true,
    brand: { name: 'AMD' },
    prices: [{ amount: BigInt(3699900), isActive: true }], // ₹36,999
    inventory: { id: 'inv-cpu', quantity: 10, reservedQty: 0 },
    specifications: { socket: 'AM5', tdp: 120 },
  };

  const mockAddress = {
    id: 'addr_test_1',
    userId: testUser.sub,
    firstName: 'Gaurav',
    lastName: 'Sharma',
    line1: 'Flat 402, Quantum Towers',
    city: 'Hyderabad',
    state: 'Telangana',
    postalCode: '500081',
    country: 'IN',
    phone: '9876543210',
  };

  const createdOrders: any[] = [];

  beforeAll(async () => {
    mockDb = {
      product: {
        findUnique: jest.fn(async ({ where }: any) => {
          if (where.id === mockProductCpu.id) return mockProductCpu;
          return null;
        }),
      },
      address: {
        findFirst: jest.fn(async () => mockAddress),
        create: jest.fn(async ({ data }: any) => ({ id: 'addr_new_1', ...data })),
      },
      userAddress: {
        findFirst: jest.fn(async () => mockAddress),
        create: jest.fn(async ({ data }: any) => ({ id: 'addr_new_1', ...data })),
      },
      coupon: {
        findUnique: jest.fn(async ({ where }: any) => {
          if (where.code === 'NEXUS10') {
            return {
              id: 'coupon_nexus10',
              code: 'NEXUS10',
              type: 'PERCENTAGE',
              value: 10,
              isActive: true,
            };
          }
          return null;
        }),
        update: jest.fn(async () => {}),
      },
      couponUsage: {
        create: jest.fn(async () => {}),
      },
      order: {
        findFirst: jest.fn(async ({ where }: any) => {
          return createdOrders.find((o) => o.id === where.id) || null;
        }),
        findMany: jest.fn(async () => createdOrders),
        count: jest.fn(async () => createdOrders.length),
      },
      inventory: {
        findFirst: jest.fn(async () => mockProductCpu.inventory),
        update: jest.fn(async () => {}),
      },
      $transaction: jest.fn(async (cb: any) => {
        const tx = {
          order: {
            create: jest.fn(async ({ data }: any) => {
              const order = {
                id: `order_${Date.now()}`,
                ...data,
                createdAt: new Date(),
                updatedAt: new Date(),
                items: data.items.create.map((item: any) => ({
                  id: `order_item_${Date.now()}`,
                  ...item,
                })),
              };
              createdOrders.push(order);
              return order;
            }),
          },
          inventory: {
            findFirst: jest.fn(async () => mockProductCpu.inventory),
            update: jest.fn(async () => {}),
          },
          couponUsage: {
            create: jest.fn(async () => {}),
          },
          coupon: {
            update: jest.fn(async () => {}),
          },
          cart: {
            findFirst: jest.fn(async () => null),
          },
          cartItem: {
            deleteMany: jest.fn(async () => {}),
          },
        };
        return cb(tx);
      }),
    };

    // STRICT REQUIREMENT: Mock Payment Provider ensuring zero real external payment requests
    mockPaymentsService = {
      createPaymentIntent: jest.fn(async (userId: string, dto: any) => {
        return {
          paymentIntentId: `pi_mock_${Date.now()}`,
          clientSecret: `cs_mock_secret_${Date.now()}`,
          orderId: dto.orderId,
          amount: 36999,
          currency: 'INR',
          provider: 'MOCK_SANDBOX_GATEWAY',
          status: 'REQUIRES_PAYMENT_METHOD',
          isSandbox: true,
        };
      }),
    };

    mockCouponsService = {
      validateCoupon: jest.fn(async (code: string, subtotal: number) => {
        if (code === 'NEXUS10') {
          return {
            valid: true,
            discountAmount: Math.round(subtotal * 0.1),
            coupon: { code: 'NEXUS10', type: 'PERCENTAGE', value: 10 },
          };
        }
        return { valid: false, discountAmount: 0, reason: 'Invalid or expired coupon' };
      }),
    };

    mockOrdersRepo = {
      findById: jest.fn(async (id: string) => createdOrders.find((o) => o.id === id) || null),
      findAllByUser: jest.fn(async () => createdOrders),
      countByUser: jest.fn(async () => createdOrders.length),
      countAllByUser: jest.fn(async () => createdOrders.length),
    };

    mockCartRepo = {
      findActiveCartByUser: jest.fn(async () => null),
    };

    mockCompatService = {
      check: jest.fn(() => ({ status: 'compatible', compatible: true, issues: [] })),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [
        OrdersService,
        { provide: DatabaseService, useValue: mockDb },
        { provide: PaymentsService, useValue: mockPaymentsService },
        { provide: CouponsService, useValue: mockCouponsService },
        { provide: OrdersRepository, useValue: mockOrdersRepo },
        { provide: CartRepository, useValue: mockCartRepo },
        { provide: CompatibilityService, useValue: mockCompatService },
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

  describe('POST /orders/checkout-summary', () => {
    it('calculates authoritative subtotal, coupon discount, GST, and totals before order placement', async () => {
      const res = await request(app.getHttpServer())
        .post('/orders/checkout-summary')
        .send({
          items: [{ productId: mockProductCpu.id, quantity: 1 }],
          couponCode: 'NEXUS10',
          shippingOption: 'standard',
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      const summary = res.body.data;
      expect(summary.subtotal).toBe(36999);
      expect(summary.discountAmount).toBe(3700); // 10%
      expect(summary.taxAmount).toBe(Math.round(36999 * 0.18));
      expect(summary.inventoryAvailable).toBe(true);
    });
  });

  describe('POST /orders/checkout (Authoritative 7-Step Checkout Flow)', () => {
    let placedOrderId: string;

    it('creates order, decrements/reserves inventory, and creates mock payment intent without real payment gateway', async () => {
      const checkoutPayload = {
        items: [{ productId: mockProductCpu.id, quantity: 1 }],
        shippingAddress: {
          firstName: 'Gaurav',
          lastName: 'Sharma',
          line1: 'Flat 402, Quantum Towers',
          city: 'Hyderabad',
          state: 'Telangana',
          postalCode: '500081',
          country: 'IN',
          phone: '9876543210',
        },
        paymentMethod: 'upi',
        shippingOption: 'standard',
        couponCode: 'NEXUS10',
      };

      const res = await request(app.getHttpServer())
        .post('/orders/checkout')
        .send(checkoutPayload)
        .expect(201);

      expect(res.body.success).toBe(true);
      const { order, paymentIntent } = res.body.data;

      expect(order).toHaveProperty('id');
      expect(order).toHaveProperty('totalAmount');
      expect(order.status).toBe(OrderStatus.PENDING);
      expect(order.items).toHaveLength(1);

      // Verify Mock Payment Intent isolation
      expect(paymentIntent).toBeDefined();
      expect(paymentIntent.provider).toBe('MOCK_SANDBOX_GATEWAY');
      expect(paymentIntent.isSandbox).toBe(true);
      expect(mockPaymentsService.createPaymentIntent).toHaveBeenCalledTimes(1);

      placedOrderId = order.id;
    });

    it('prevents checkout if requested items are out of stock', async () => {
      mockDb.product.findUnique.mockResolvedValueOnce({
        ...mockProductCpu,
        inventory: { id: 'inv-zero', quantity: 0, reservedQty: 0 },
      });

      const res = await request(app.getHttpServer())
        .post('/orders/checkout')
        .send({
          items: [{ productId: mockProductCpu.id, quantity: 1 }],
          shippingAddress: {
            firstName: 'Gaurav',
            lastName: 'Sharma',
            line1: '123 Street',
            city: 'Hyderabad',
            state: 'Telangana',
            postalCode: '500081',
          },
          paymentMethod: 'upi',
        })
        .expect(409); // ConflictException

      expect(res.body.message).toContain('Insufficient inventory');
    });

    it('GET /orders/my-orders returns customer orders', async () => {
      const res = await request(app.getHttpServer()).get('/orders/my-orders').expect(200);

      expect(res.body).toHaveProperty('data');
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('GET /orders/:id returns the placed order details', async () => {
      const res = await request(app.getHttpServer()).get(`/orders/${placedOrderId}`).expect(200);

      expect(res.body).toHaveProperty('id', placedOrderId);
      expect(res.body).toHaveProperty('totalAmount');
      expect(res.body.items).toHaveLength(1);
    });
  });
});

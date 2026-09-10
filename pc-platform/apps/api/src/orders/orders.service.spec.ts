import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { CompatibilityService } from '@pc-platform/compatibility-engine';
import { DatabaseService, OrderStatus, PaymentStatus } from '@pc-platform/database';

import { CartRepository } from '../cart/cart.repository';
import { CouponsService } from '../coupons/coupons.service';
import { PaymentsService } from '../payments/payments.service';

import { OrdersRepository } from './orders.repository';
import { OrdersService } from './orders.service';


describe('OrdersService', () => {
  let service: OrdersService;
  let db: any;
  let ordersRepo: any;
  let cartRepo: any;
  let couponsService: any;
  let paymentsService: any;
  let compatibilityService: any;

  const mockProductCpu = {
    id: 'prod-cpu-1',
    name: 'Intel Core i7-14700K',
    sku: 'CPU-INTEL-14700K',
    model: '14700K',
    category: 'CPU',
    isActive: true,
    brand: { name: 'Intel' },
    prices: [{ amount: BigInt(3500000), isActive: true }], // 35,000 INR
    inventory: { id: 'inv-cpu', quantity: 10, reservedQty: 2 }, // 8 available
  };

  const mockProductGpu = {
    id: 'prod-gpu-1',
    name: 'NVIDIA GeForce RTX 4070',
    sku: 'GPU-RTX-4070',
    model: 'RTX 4070',
    category: 'GPU',
    isActive: true,
    brand: { name: 'NVIDIA' },
    prices: [{ amount: BigInt(5500000), isActive: true }], // 55,000 INR
    inventory: { id: 'inv-gpu', quantity: 5, reservedQty: 1 }, // 4 available
  };

  const mockAddress = {
    id: 'addr-1',
    userId: 'user-1',
    firstName: 'Gaurav',
    lastName: 'Amgaur',
    line1: '123 Tech Park',
    city: 'Mumbai',
    state: 'Maharashtra',
    postalCode: '400001',
    country: 'IN',
    phone: '9876543210',
  };

  beforeEach(async () => {
    db = {
      product: {
        findUnique: jest.fn(),
      },
      build: {
        findUnique: jest.fn(),
      },
      coupon: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      couponUsage: {
        create: jest.fn(),
      },
      inventory: {
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      order: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
      userAddress: {
        findFirst: jest.fn(),
        create: jest.fn().mockResolvedValue(mockAddress),
      },
      cart: {
        findFirst: jest.fn(),
      },
      cartItem: {
        deleteMany: jest.fn(),
      },
      $transaction: jest.fn().mockImplementation(async (cb) => cb(db)),
    };

    ordersRepo = {
      findAllByUser: jest.fn(),
      countByUser: jest.fn(),
      findById: jest.fn(),
      findByIdWithItems: jest.fn(),
      findByOrderNumber: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateStatus: jest.fn(),
    };

    cartRepo = {
      findActiveCartByUser: jest.fn(),
    };

    couponsService = {
      validateCoupon: jest.fn().mockResolvedValue({ valid: false, discountAmount: 0 }),
      recordCouponUsage: jest.fn(),
    };

    paymentsService = {
      createPaymentIntent: jest.fn().mockResolvedValue({
        paymentId: 'pay-intent-1',
        orderId: 'order-123',
        clientSecret: 'secret-123',
        amount: 106200,
        currency: 'INR',
        status: PaymentStatus.PENDING,
      }),
      verifyPayment: jest.fn(),
      refundPayment: jest.fn(),
    };

    compatibilityService = {
      check: jest.fn().mockReturnValue({
        status: 'compatible',
        issues: [],
        warnings: [],
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: DatabaseService, useValue: db },
        { provide: OrdersRepository, useValue: ordersRepo },
        { provide: CartRepository, useValue: cartRepo },
        { provide: CouponsService, useValue: couponsService },
        { provide: PaymentsService, useValue: paymentsService },
        { provide: CompatibilityService, useValue: compatibilityService },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getCheckoutSummary', () => {
    it('should compute authoritative totals and availability from database prices', async () => {
      db.product.findUnique.mockResolvedValueOnce(mockProductCpu);

      const result = await service.getCheckoutSummary('user-1', {
        items: [{ productId: 'prod-cpu-1', quantity: 1 }],
      });

      expect(result).toBeDefined();
      expect(result.subtotal).toBe(35000);
      expect(result.shippingCost).toBe(1500); // under 50000 threshold
      expect(result.taxAmount).toBe(6300); // 18% of 35000
      expect(result.total).toBe(36500); // 35000 + 1500
      expect(result.inventoryAvailable).toBe(true);
      expect(result.items[0]!.unitPrice).toBe(35000);
      expect(result.items[0]!.inStock).toBe(true);
    });

    it('should grant free shipping if subtotal >= 50,000 INR', async () => {
      db.product.findUnique.mockResolvedValueOnce(mockProductGpu);

      const result = await service.getCheckoutSummary('user-1', {
        items: [{ productId: 'prod-gpu-1', quantity: 1 }],
      });

      expect(result.subtotal).toBe(55000);
      expect(result.shippingCost).toBe(0); // free shipping over 50k
      expect(result.total).toBe(55000);
    });

    it('should apply valid coupon discount to summary', async () => {
      db.product.findUnique.mockResolvedValueOnce(mockProductGpu);
      couponsService.validateCoupon.mockResolvedValueOnce({
        valid: true,
        couponCode: 'NEXUS10',
        couponType: 'PERCENTAGE',
        discountAmount: 5000,
        message: '10% discount applied',
      });

      const result = await service.getCheckoutSummary('user-1', {
        items: [{ productId: 'prod-gpu-1', quantity: 1 }],
        couponCode: 'NEXUS10',
      });

      expect(result.discountAmount).toBe(5000);
      expect(result.total).toBe(50000);
      expect(result.appliedCoupon?.valid).toBe(true);
    });

    it('should mark items unavailable when requested quantity exceeds available stock', async () => {
      db.product.findUnique.mockResolvedValueOnce(mockProductGpu); // 4 available

      const result = await service.getCheckoutSummary('user-1', {
        items: [{ productId: 'prod-gpu-1', quantity: 10 }],
      });

      expect(result.inventoryAvailable).toBe(false);
      expect(result.unavailableItems.length).toBe(1);
      expect(result.unavailableItems[0]!.productId).toBe('prod-gpu-1');
      expect(result.unavailableItems[0]!.availableQty).toBe(4);
      expect(result.items[0]!.inStock).toBe(false);
    });
  });

  describe('checkout', () => {
    it('should reject checkout with empty items', async () => {
      cartRepo.findActiveCartByUser.mockResolvedValue(null);

      await expect(
        service.checkout('user-1', {
          shippingAddress: mockAddress,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject checkout if any item is out of stock', async () => {
      db.product.findUnique.mockResolvedValueOnce(mockProductGpu); // 4 available

      await expect(
        service.checkout('user-1', {
          items: [{ productId: 'prod-gpu-1', quantity: 5 }],
          shippingAddress: mockAddress,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should reject checkout if build bundle is incompatible', async () => {
      db.product.findUnique.mockResolvedValue(mockProductCpu);
      db.build.findUnique.mockResolvedValue({
        id: 'build-bad',
        items: [
          { productId: 'prod-cpu-1', product: mockProductCpu, quantity: 1 },
        ],
      });
      compatibilityService.check.mockReturnValue({
        status: 'incompatible',
        issues: [{ title: 'Socket mismatch', severity: 'incompatible' }],
      });

      await expect(
        service.checkout('user-1', {
          buildId: 'build-bad',
          shippingAddress: mockAddress,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should successfully execute 7-step checkout, reserve inventory and create payment intent', async () => {
      db.product.findUnique.mockResolvedValueOnce(mockProductCpu);
      db.inventory.findFirst.mockResolvedValue(mockProductCpu.inventory);

      const createdMockOrder = {
        id: 'order-created-1',
        orderNumber: 'PCP-2026-999999',
        userId: 'user-1',
        status: OrderStatus.PENDING,
        currency: 'INR',
        subtotal: 35000,
        discountAmount: 0,
        shippingCost: 1500,
        taxAmount: 6300,
        total: 36500,
        createdAt: new Date(),
        updatedAt: new Date(),
        items: [
          {
            id: 'oi-1',
            productId: 'prod-cpu-1',
            quantity: 1,
            unitPrice: 35000,
            totalPrice: 35000,
          },
        ],
      };

      db.order.create.mockResolvedValue(createdMockOrder);

      const result = await service.checkout('user-1', {
        items: [{ productId: 'prod-cpu-1', quantity: 1 }],
        shippingAddress: mockAddress,
      });

      expect(result).toBeDefined();
      expect(result.order).toBeDefined();
      expect(result.order.id).toBe('order-created-1');
      expect(result.paymentIntent).toBeDefined();
      expect(result.paymentIntent.paymentId).toBe('pay-intent-1');

      // Check inventory reservation step: reservedQty incremented
      expect(db.inventory.update).toHaveBeenCalledWith({
        where: { id: 'inv-cpu' },
        data: { reservedQty: 3 }, // 2 initial + 1 requested
      });

      // Check payment intent step was called
      expect(paymentsService.createPaymentIntent).toHaveBeenCalledWith('user-1', {
        orderId: 'order-created-1',
      });
    });
  });

  describe('updateStatus', () => {
    it('should release reserved inventory when cancelling a PENDING order', async () => {
      const pendingOrder = {
        id: 'order-cancel',
        status: OrderStatus.PENDING,
        items: [{ productId: 'prod-cpu-1', quantity: 1 }],
      };
      ordersRepo.findById.mockResolvedValue(pendingOrder);
      db.inventory.findFirst.mockResolvedValue({ id: 'inv-1', reservedQty: 3, quantity: 10 });
      db.order.update.mockResolvedValue({ ...pendingOrder, status: OrderStatus.CANCELLED });

      await service.updateStatus('order-cancel', { status: OrderStatus.CANCELLED });

      expect(db.inventory.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'inv-1' },
          data: { reservedQty: 2 }, // 3 - 1
        }),
      );
    });

    it('should commit inventory (deduct quantity and reservedQty) when confirming a PENDING order', async () => {
      const pendingOrder = {
        id: 'order-confirm',
        status: OrderStatus.PENDING,
        items: [{ productId: 'prod-cpu-1', quantity: 1 }],
      };
      ordersRepo.findById.mockResolvedValue(pendingOrder);
      db.inventory.findFirst.mockResolvedValue({ id: 'inv-1', reservedQty: 3, quantity: 10 });
      db.order.update.mockResolvedValue({ ...pendingOrder, status: OrderStatus.CONFIRMED });

      await service.updateStatus('order-confirm', { status: OrderStatus.CONFIRMED });

      expect(db.inventory.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'inv-1' },
          data: { quantity: 9, reservedQty: 2 },
        }),
      );
    });
  });
});

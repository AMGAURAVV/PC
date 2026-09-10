import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { DatabaseService, OrderStatus, PaymentStatus } from '@pc-platform/database';

import { PAYMENT_PROVIDER_TOKEN } from './interfaces/payment-provider.interface';
import { PaymentsService } from './payments.service';
import { MockPaymentProvider } from './providers/mock-payment.provider';


describe('PaymentsService', () => {
  let service: PaymentsService;
  let db: any;
  let mockProvider: MockPaymentProvider;

  const mockOrder = {
    id: 'order-123',
    orderNumber: 'PCP-2026-00001',
    userId: 'user-1',
    total: 85000,
    currency: 'INR',
    status: OrderStatus.PENDING,
    user: {
      id: 'user-1',
      email: 'user@example.com',
      firstName: 'Gaurav',
      lastName: 'Amgaur',
      phone: '9876543210',
    },
    items: [
      {
        id: 'item-1',
        productId: 'prod-cpu',
        variantId: null,
        quantity: 1,
        unitPrice: 20000,
      },
    ],
  };

  const mockInventory = {
    id: 'inv-1',
    productId: 'prod-cpu',
    quantity: 10,
    reservedQty: 1,
  };

  beforeEach(async () => {
    mockProvider = new MockPaymentProvider();

    db = {
      order: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      payment: {
        create: jest.fn().mockImplementation(({ data }) => ({ id: 'pay-db-1', ...data })),
        update: jest.fn(),
        updateMany: jest.fn(),
        findUnique: jest.fn(),
      },
      inventory: {
        findFirst: jest.fn().mockResolvedValue(mockInventory),
        update: jest.fn(),
      },
      $transaction: jest.fn().mockImplementation(async (cb) => cb(db)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        {
          provide: DatabaseService,
          useValue: db,
        },
        {
          provide: PAYMENT_PROVIDER_TOKEN,
          useValue: mockProvider,
        },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createPaymentIntent', () => {
    it('should throw NotFoundException if order does not exist', async () => {
      db.order.findUnique.mockResolvedValue(null);
      await expect(
        service.createPaymentIntent('user-1', { orderId: 'non-existent' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if order does not belong to user', async () => {
      db.order.findUnique.mockResolvedValue(mockOrder);
      await expect(
        service.createPaymentIntent('other-user', { orderId: 'order-123' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if order is not in PENDING status', async () => {
      db.order.findUnique.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.CONFIRMED,
      });
      await expect(
        service.createPaymentIntent('user-1', { orderId: 'order-123' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should successfully create payment intent via provider and record in DB', async () => {
      db.order.findUnique.mockResolvedValue(mockOrder);

      const result = await service.createPaymentIntent('user-1', { orderId: 'order-123' });

      expect(result).toBeDefined();
      expect(result.orderId).toBe('order-123');
      expect(result.orderNumber).toBe('PCP-2026-00001');
      expect(result.amount).toBe(85000);
      expect(result.clientSecret).toBeDefined();
      expect(result.status).toBe(PaymentStatus.PENDING);
      expect(db.payment.create).toHaveBeenCalled();
    });
  });

  describe('verifyPayment', () => {
    it('should confirm order and commit reserved inventory on successful verification', async () => {
      db.order.findUnique.mockResolvedValue(mockOrder);

      const result = await service.verifyPayment('user-1', {
        orderId: 'order-123',
        providerPaymentId: 'pay_mock_success',
      });

      expect(result.verified).toBe(true);
      expect(result.orderStatus).toBe(OrderStatus.CONFIRMED);
      expect(result.paymentStatus).toBe(PaymentStatus.CAPTURED);
      expect(db.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'order-123' },
          data: { status: OrderStatus.CONFIRMED },
        }),
      );
      // Verify inventory commit
      expect(db.inventory.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { quantity: 9, reservedQty: 0 },
        }),
      );
    });

    it('should handle verification failure cleanly and mark payment FAILED', async () => {
      db.order.findUnique.mockResolvedValue(mockOrder);

      const result = await service.verifyPayment('user-1', {
        orderId: 'order-123',
        providerPaymentId: 'pay_mock_failed',
        signature: 'test_invalid',
      });

      expect(result.verified).toBe(false);
      expect(result.paymentStatus).toBe(PaymentStatus.FAILED);
      expect(db.payment.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: PaymentStatus.FAILED }),
        }),
      );
    });
  });
});

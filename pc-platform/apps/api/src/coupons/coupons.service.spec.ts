import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { DatabaseService, CouponType } from '@pc-platform/database';

import { CouponsService } from './coupons.service';

describe('CouponsService', () => {
  let service: CouponsService;
  let db: any;

  beforeEach(async () => {
    db = {
      coupon: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      couponUsage: {
        count: jest.fn(),
        create: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CouponsService,
        {
          provide: DatabaseService,
          useValue: db,
        },
      ],
    }).compile();

    service = module.get<CouponsService>(CouponsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should validate percentage coupon within limits', async () => {
    db.coupon.findUnique.mockResolvedValue({
      id: 'coupon-1',
      code: 'SUMMER20',
      isActive: true,
      couponType: CouponType.PERCENTAGE,
      value: 20,
      minOrderAmount: 10000,
      maxDiscountAmount: 3000,
      usageLimit: 100,
      usageCount: 10,
      usagePerUser: 1,
    });

    // 20% of 20,000 is 4,000, but capped at 3,000
    const result = await service.validateCoupon('SUMMER20', 20000, 'user-1');

    expect(result.valid).toBe(true);
    expect(result.discountAmount).toBe(3000);
    expect(result.couponCode).toBe('SUMMER20');
  });

  it('should reject coupon if minimum order amount is not met', async () => {
    db.coupon.findUnique.mockResolvedValue({
      id: 'coupon-1',
      code: 'MEGA50',
      isActive: true,
      couponType: CouponType.FIXED_AMOUNT,
      value: 5000,
      minOrderAmount: 50000,
      usageLimit: 50,
      usageCount: 0,
      usagePerUser: 1,
    });

    const result = await service.validateCoupon('MEGA50', 30000, 'user-1');

    expect(result.valid).toBe(false);
    expect(result.discountAmount).toBe(0);
    expect(result.message).toContain('Minimum order amount');
  });

  it('should validate built-in promo codes if DB coupon is not found', async () => {
    db.coupon.findUnique.mockResolvedValue(null);

    const result = await service.validateCoupon('NEXUS10', 30000);

    expect(result.valid).toBe(true);
    expect(result.discountAmount).toBe(3000); // 10% of 30,000
  });
});

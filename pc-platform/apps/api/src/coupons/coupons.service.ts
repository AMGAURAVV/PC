import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService, CouponType } from '@pc-platform/database';
import type { CouponValidationResult } from '@pc-platform/types';

import type { CreateCouponDto } from './dto/coupon.dto';
import { ValidateCouponDto } from './dto/coupon.dto';


@Injectable()
export class CouponsService {
  private readonly logger = new Logger(CouponsService.name);

  constructor(private readonly db: DatabaseService) {}

  public async validateCoupon(
    code: string,
    orderAmount: number,
    userId?: string,
  ): Promise<CouponValidationResult> {
    const normalizedCode = code.toUpperCase().trim();

    // 1. Check in database
    const coupon = await this.db.coupon.findUnique({
      where: { code: normalizedCode },
    });

    if (!coupon) {
      // Check built-in fallback promo codes if DB doesn't have it yet
      return this.validateBuiltinFallback(normalizedCode, orderAmount);
    }

    // 2. Active status
    if (!coupon.isActive) {
      return {
        valid: false,
        discountAmount: 0,
        message: 'This coupon is no longer active',
      };
    }

    // 3. Date validity
    const now = new Date();
    if (coupon.startsAt && now < coupon.startsAt) {
      return {
        valid: false,
        discountAmount: 0,
        message: 'This coupon promotion has not started yet',
      };
    }

    if (coupon.expiresAt && now > coupon.expiresAt) {
      return {
        valid: false,
        discountAmount: 0,
        message: 'This coupon has expired',
      };
    }

    // 4. Usage limit
    if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
      return {
        valid: false,
        discountAmount: 0,
        message: 'This coupon has reached its maximum total usage limit',
      };
    }

    // 5. Per-user usage limit
    if (userId && coupon.usagePerUser !== null) {
      const userUsageCount = await this.db.couponUsage.count({
        where: { couponId: coupon.id, userId },
      });

      if (userUsageCount >= coupon.usagePerUser) {
        return {
          valid: false,
          discountAmount: 0,
          message: 'You have already reached the maximum usage limit for this coupon',
        };
      }
    }

    // 6. Minimum order amount
    const minOrder = coupon.minOrderAmount ? Number(coupon.minOrderAmount) : 0;
    if (orderAmount < minOrder) {
      return {
        valid: false,
        discountAmount: 0,
        message: `Minimum order amount of ₹${minOrder.toLocaleString('en-IN')} required for this coupon`,
      };
    }

    // 7. Calculate discount
    const discount = this.calculateDiscount(
      coupon.couponType,
      Number(coupon.value),
      orderAmount,
      coupon.maxDiscountAmount ? Number(coupon.maxDiscountAmount) : undefined,
    );

    return {
      valid: true,
      couponCode: coupon.code,
      couponType: coupon.couponType as any,
      discountAmount: discount,
      message: `Coupon applied: ₹${discount.toLocaleString('en-IN')} savings!`,
    };
  }

  public async recordCouponUsage(
    couponId: string,
    userId: string,
    orderId: string,
    tx?: any,
  ): Promise<void> {
    const client = tx || this.db;

    await client.couponUsage.create({
      data: {
        couponId,
        userId,
        orderId,
      },
    });

    await client.coupon.update({
      where: { id: couponId },
      data: {
        usageCount: { increment: 1 },
      },
    });
  }

  public async findActiveCoupons(): Promise<any[]> {
    const now = new Date();
    const coupons = await this.db.coupon.findMany({
      where: {
        isActive: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      select: {
        id: true,
        code: true,
        description: true,
        couponType: true,
        value: true,
        minOrderAmount: true,
        maxDiscountAmount: true,
        expiresAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (coupons.length === 0) {
      // Return standard promo banners
      return [
        {
          code: 'NEXUS10',
          description: '10% off on your hardware configuration (up to ₹5,000)',
          couponType: 'PERCENTAGE',
          value: 10,
          minOrderAmount: 25000,
          maxDiscountAmount: 5000,
        },
        {
          code: 'BUILDER50',
          description: '₹5,000 flat discount on complete build bundles above ₹50,000',
          couponType: 'FIXED_AMOUNT',
          value: 5000,
          minOrderAmount: 50000,
        },
      ];
    }

    return coupons;
  }

  public async createCoupon(dto: CreateCouponDto): Promise<any> {
    const normalizedCode = dto.code.toUpperCase().trim();
    const existing = await this.db.coupon.findUnique({
      where: { code: normalizedCode },
    });

    if (existing) {
      throw new ConflictException(`Coupon with code ${normalizedCode} already exists`);
    }

    return this.db.coupon.create({
      data: {
        code: normalizedCode,
        description: dto.description ?? null,
        couponType: dto.couponType,
        value: dto.value,
        minOrderAmount: dto.minOrderAmount ?? null,
        maxDiscountAmount: dto.maxDiscountAmount ?? null,
        usageLimit: dto.usageLimit ?? null,
        usagePerUser: dto.usagePerUser ?? null,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : null,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      },
    });
  }

  private calculateDiscount(
    type: CouponType,
    value: number,
    orderAmount: number,
    maxDiscount?: number,
  ): number {
    if (type === CouponType.PERCENTAGE) {
      const computed = Math.round((orderAmount * value) / 100);
      return maxDiscount && maxDiscount > 0 ? Math.min(computed, maxDiscount) : computed;
    } else if (type === CouponType.FIXED_AMOUNT) {
      return Math.min(orderAmount, value);
    } else if (type === CouponType.FREE_SHIPPING) {
      return 1500; // Standard shipping fee waived
    }
    return 0;
  }

  private validateBuiltinFallback(code: string, orderAmount: number): CouponValidationResult {
    if (code === 'NEXUS10') {
      if (orderAmount < 25000) {
        return {
          valid: false,
          discountAmount: 0,
          message: 'Minimum order amount of ₹25,000 required for coupon NEXUS10',
        };
      }
      const discount = Math.min(Math.round(orderAmount * 0.10), 5000);
      return {
        valid: true,
        couponCode: 'NEXUS10',
        couponType: 'PERCENTAGE',
        discountAmount: discount,
        message: `Coupon NEXUS10 applied: ₹${discount.toLocaleString('en-IN')} savings!`,
      };
    } else if (code === 'BUILDER50') {
      if (orderAmount < 50000) {
        return {
          valid: false,
          discountAmount: 0,
          message: 'Minimum order amount of ₹50,000 required for coupon BUILDER50',
        };
      }
      return {
        valid: true,
        couponCode: 'BUILDER50',
        couponType: 'FIXED_AMOUNT',
        discountAmount: 5000,
        message: 'Coupon BUILDER50 applied: ₹5,000 savings!',
      };
    }

    return {
      valid: false,
      discountAmount: 0,
      message: 'Invalid coupon code',
    };
  }
}

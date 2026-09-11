import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '@pc-platform/database';

import { PaginatedResponse } from '../../common/dto/response.dto';
import { AdminAuditService } from '../admin-audit.service';
import { BulkOperationResultDto } from '../dto/admin-common.dto';
import type {
  CreateCouponDto,
  UpdateCouponDto,
  BulkCouponStatusDto,
  CouponFilterDto,
} from '../dto/admin-coupon.dto';

@Injectable()
export class AdminCouponsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly audit: AdminAuditService,
  ) {}

  async findAll(query: CouponFilterDto) {
    const where: any = {};
    if (query.search) {
      where.OR = [
        { code: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.couponType) {
      where.couponType = query.couponType as any;
    }
    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    const [items, total] = await Promise.all([
      this.db.coupon.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { usages: true, orders: true } } },
      }),
      this.db.coupon.count({ where }),
    ]);

    return PaginatedResponse.ok(items, query.page, query.limit, total);
  }

  async findOne(id: string) {
    const coupon = await this.db.coupon.findUnique({
      where: { id },
      include: {
        usages: {
          take: 50,
          orderBy: { id: 'desc' },
          include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } },
        },
        _count: { select: { usages: true, orders: true } },
      },
    });

    if (!coupon) {
      throw new NotFoundException(`Coupon with ID "${id}" not found`);
    }

    return coupon;
  }

  async create(dto: CreateCouponDto, actor?: any) {
    const existing = await this.db.coupon.findUnique({ where: { code: dto.code.toUpperCase() } });
    if (existing) {
      throw new BadRequestException(`Coupon with code "${dto.code.toUpperCase()}" already exists`);
    }

    const coupon = await this.db.coupon.create({
      data: {
        code: dto.code.toUpperCase(),
        description: dto.description ?? null,
        couponType: dto.couponType as any,
        value: dto.value,
        minOrderAmount: dto.minOrderAmount ?? null,
        maxDiscountAmount: dto.maxDiscountAmount ?? null,
        currency: dto.currency || 'INR',
        usageLimit: dto.usageLimit ?? null,
        usagePerUser: dto.usagePerUser ?? null,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : null,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        applicableToProductIds: dto.applicableToProductIds || [],
        applicableToCategoryIds: dto.applicableToCategoryIds || [],
        isActive: dto.isActive ?? true,
      },
    });

    await this.audit.record({
      actor,
      action: 'CREATE',
      entityType: 'Coupon',
      entityId: coupon.id,
      entityLabel: coupon.code,
      after: coupon,
    });

    return coupon;
  }

  async update(id: string, dto: UpdateCouponDto, actor?: any) {
    const current = await this.findOne(id);

    const updated = await this.db.coupon.update({
      where: { id },
      data: {
        ...(dto.code && { code: dto.code.toUpperCase() }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.couponType && { couponType: dto.couponType as any }),
        ...(dto.value !== undefined && { value: dto.value }),
        ...(dto.minOrderAmount !== undefined && { minOrderAmount: dto.minOrderAmount }),
        ...(dto.maxDiscountAmount !== undefined && { maxDiscountAmount: dto.maxDiscountAmount }),
        ...(dto.usageLimit !== undefined && { usageLimit: dto.usageLimit }),
        ...(dto.usagePerUser !== undefined && { usagePerUser: dto.usagePerUser }),
        ...(dto.startsAt !== undefined && { startsAt: dto.startsAt ? new Date(dto.startsAt) : null }),
        ...(dto.expiresAt !== undefined && { expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null }),
        ...(dto.applicableToProductIds && { applicableToProductIds: dto.applicableToProductIds }),
        ...(dto.applicableToCategoryIds && { applicableToCategoryIds: dto.applicableToCategoryIds }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });

    await this.audit.record({
      actor,
      action: 'UPDATE',
      entityType: 'Coupon',
      entityId: id,
      entityLabel: updated.code,
      before: current,
      after: updated,
    });

    return updated;
  }

  async delete(id: string, actor?: any, force: boolean = false) {
    const current = await this.findOne(id);

    const usageCount = await this.db.couponUsage.count({ where: { couponId: id } });
    if (usageCount > 0 && !force) {
      // Safe destructive operation: Deactivate instead of delete to preserve financial history
      const deactivated = await this.db.coupon.update({
        where: { id },
        data: { isActive: false },
      });

      await this.audit.record({
        actor,
        action: 'SUSPEND',
        entityType: 'Coupon',
        entityId: id,
        entityLabel: current.code,
        metadata: { reason: 'Deactivated due to existing usage history' },
      });

      return {
        success: true,
        softDeleted: true,
        message: `Coupon "${current.code}" has ${usageCount} recorded redemptions; deactivated rather than deleted to protect order history`,
      };
    }

    await this.db.coupon.delete({ where: { id } });

    await this.audit.record({
      actor,
      action: 'DELETE',
      entityType: 'Coupon',
      entityId: id,
      entityLabel: current.code,
      before: current,
    });

    return { success: true, softDeleted: false, message: `Coupon "${current.code}" permanently deleted` };
  }

  async bulkStatus(dto: BulkCouponStatusDto, actor?: any): Promise<BulkOperationResultDto> {
    const errors: Array<{ id: string; error: string }> = [];
    let successCount = 0;

    for (const id of dto.couponIds) {
      try {
        await this.db.coupon.update({
          where: { id },
          data: { isActive: dto.isActive },
        });
        successCount++;
      } catch (err: any) {
        errors.push({ id, error: err.message || 'Update failed' });
      }
    }

    await this.audit.record({
      actor,
      action: dto.isActive ? 'ACTIVATE' : 'SUSPEND',
      entityType: 'Coupon',
      metadata: { bulk: true, count: successCount, total: dto.couponIds.length },
    });

    return BulkOperationResultDto.create(dto.couponIds.length, successCount, errors);
  }
}

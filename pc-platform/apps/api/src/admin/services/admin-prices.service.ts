import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '@pc-platform/database';
import { AdminAuditService } from '../admin-audit.service';
import {
  AdminCreatePriceDto,
  AdminUpdatePriceDto,
  BulkPriceUpdateDto,
  BulkPriceAdjustmentType,
  PriceHistoryFilterDto,
} from '../dto/admin-price.dto';
import { BulkOperationResultDto } from '../dto/admin-common.dto';
import { PaginatedResponse } from '../../common/dto/response.dto';
import { CacheService } from '../../common/cache/cache.service';

@Injectable()
export class AdminPricesService {
  constructor(
    private readonly db: DatabaseService,
    private readonly audit: AdminAuditService,
    private readonly cache: CacheService,
  ) {}

  async createPrice(dto: AdminCreatePriceDto, actor?: any) {
    const price = await this.db.price.create({
      data: {
        productId: dto.productId,
        variantId: dto.variantId || null,
        priceType: dto.priceType as any,
        amount: dto.amount,
        compareAt: dto.compareAt || null,
        currency: dto.currency || 'INR',
        isActive: dto.isActive ?? true,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : null,
        endsAt: dto.endsAt ? new Date(dto.endsAt) : null,
      },
      include: { product: true },
    });

    // Automatically record price history
    await this.db.priceHistory.create({
      data: {
        productId: dto.productId,
        variantId: dto.variantId || null,
        priceType: dto.priceType as any,
        amount: dto.amount,
        currency: dto.currency || 'INR',
        changedBy: actor?.email || actor?.sub || 'admin',
        reason: dto.reason || 'Initial price creation',
      },
    });

    await this.audit.record({
      actor,
      action: 'CREATE',
      entityType: 'Price',
      entityId: price.id,
      entityLabel: `${price.product.name} (${dto.priceType}: ${dto.amount})`,
      after: price,
      metadata: { reason: dto.reason },
    });

    this.cache.invalidateByTag('catalog:products');
    return price;
  }

  async updatePrice(id: string, dto: AdminUpdatePriceDto, actor?: any) {
    const current = await this.db.price.findUnique({
      where: { id },
      include: { product: true },
    });

    if (!current) {
      throw new NotFoundException(`Price record with ID "${id}" not found`);
    }

    const updated = await this.db.price.update({
      where: { id },
      data: {
        ...(dto.amount !== undefined && { amount: dto.amount }),
        ...(dto.compareAt !== undefined && { compareAt: dto.compareAt }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.startsAt !== undefined && { startsAt: dto.startsAt ? new Date(dto.startsAt) : null }),
        ...(dto.endsAt !== undefined && { endsAt: dto.endsAt ? new Date(dto.endsAt) : null }),
      },
    });

    // Record to price history if amount changed
    if (dto.amount !== undefined && Number(dto.amount) !== Number(current.amount)) {
      await this.db.priceHistory.create({
        data: {
          productId: current.productId,
          variantId: current.variantId,
          priceType: current.priceType,
          amount: dto.amount,
          currency: current.currency,
          changedBy: actor?.email || actor?.sub || 'admin',
          reason: dto.reason || 'Admin price update',
        },
      });
    }

    await this.audit.record({
      actor,
      action: 'UPDATE',
      entityType: 'Price',
      entityId: id,
      entityLabel: `${current.product.name} Price Update`,
      before: current,
      after: updated,
      metadata: { reason: dto.reason },
    });

    this.cache.invalidateByTag('catalog:products');
    return updated;
  }

  async bulkUpdatePrices(dto: BulkPriceUpdateDto, actor?: any): Promise<BulkOperationResultDto> {
    const errors: Array<{ id: string; error: string }> = [];
    let successCount = 0;

    for (const productId of dto.productIds) {
      try {
        const prices = await this.db.price.findMany({
          where: {
            productId,
            priceType: (dto.priceType || 'RETAIL') as any,
            isActive: true,
          },
        });

        for (const price of prices) {
          const currentAmount = Number(price.amount);
          let newAmount: number;

          switch (dto.adjustmentType) {
            case BulkPriceAdjustmentType.PERCENTAGE:
              newAmount = Math.round(currentAmount * (1 + dto.adjustmentValue / 100) * 100) / 100;
              break;
            case BulkPriceAdjustmentType.FIXED_AMOUNT:
              newAmount = Math.max(0, currentAmount + dto.adjustmentValue);
              break;
            case BulkPriceAdjustmentType.SET_FIXED:
              newAmount = Math.max(0, dto.adjustmentValue);
              break;
          }

          await this.db.price.update({
            where: { id: price.id },
            data: { amount: newAmount },
          });

          await this.db.priceHistory.create({
            data: {
              productId,
              variantId: price.variantId,
              priceType: price.priceType,
              amount: newAmount,
              currency: price.currency,
              changedBy: actor?.email || actor?.sub || 'admin',
              reason: dto.reason,
            },
          });
        }
        successCount++;
      } catch (err: any) {
        errors.push({ id: productId, error: err.message || 'Price adjustment failed' });
      }
    }

    await this.audit.record({
      actor,
      action: 'UPDATE',
      entityType: 'Price',
      metadata: {
        bulk: true,
        action: 'BULK_PRICE_UPDATE',
        adjustmentType: dto.adjustmentType,
        adjustmentValue: dto.adjustmentValue,
        reason: dto.reason,
        count: successCount,
      },
    });

    this.cache.invalidateByTag('catalog:products');
    return BulkOperationResultDto.create(dto.productIds.length, successCount, errors);
  }

  async getPriceHistory(query: PriceHistoryFilterDto) {
    const where: any = {};
    if (query.productId) {
      where.productId = query.productId;
    }
    if (query.variantId) {
      where.variantId = query.variantId;
    }

    const [items, total] = await Promise.all([
      this.db.priceHistory.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          product: { select: { id: true, name: true, sku: true } },
          variant: { select: { id: true, name: true, sku: true } },
        },
      }),
      this.db.priceHistory.count({ where }),
    ]);

    return PaginatedResponse.ok(items, query.page, query.limit, total);
  }
}

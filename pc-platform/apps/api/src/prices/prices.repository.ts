import { Injectable } from '@nestjs/common';
import type { DatabaseService } from '@pc-platform/database';

import type { CreatePriceDto} from './dto/price.dto';
import { PriceHistoryQueryDto } from './dto/price.dto';

@Injectable()
export class PricesRepository {
  constructor(private readonly db: DatabaseService) {}

  async findAllByProduct(productId: string, skip: number, take: number, variantId?: string) {
    const where: any = { productId };
    if (variantId !== undefined) {
      where.variantId = variantId;
    }

    return this.db.priceHistory.findMany({
      skip,
      take,
      where,
      orderBy: { effectiveDate: 'desc' },
      include: {
        product: { select: { id: true, name: true, sku: true } },
        variant: { select: { id: true, name: true, sku: true } },
      },
    });
  }

  async countAllByProduct(productId: string, variantId?: string) {
    const where: any = { productId };
    if (variantId !== undefined) {
      where.variantId = variantId;
    }

    return this.db.priceHistory.count({ where });
  }

  async findCurrentByProduct(productId: string, variantId?: string) {
    // 1. Look for active entry in prices table first
    const activePrice = await this.db.price.findFirst({
      where: {
        productId,
        ...(variantId ? { variantId } : {}),
        isActive: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    if (activePrice) {
      return {
        id: activePrice.id,
        productId: activePrice.productId,
        variantId: activePrice.variantId,
        amount: activePrice.amount,
        currency: activePrice.currency,
        source: 'STORE_ACTIVE_PRICE',
        effectiveDate: activePrice.startsAt || activePrice.updatedAt,
        endDate: activePrice.endsAt || null,
        createdAt: activePrice.updatedAt,
      };
    }

    // 2. Fall back to latest priceHistory
    return this.db.priceHistory.findFirst({
      where: {
        productId,
        ...(variantId ? { variantId } : {}),
        effectiveDate: { lte: new Date() },
      },
      orderBy: { effectiveDate: 'desc' },
    });
  }

  async getPriceMetrics(productId: string, variantId?: string) {
    const where: any = { productId };
    if (variantId) {
      where.variantId = variantId;
    }

    const allHistory = await this.db.priceHistory.findMany({
      where,
      select: { amount: true, effectiveDate: true },
      orderBy: { effectiveDate: 'desc' },
    });

    if (allHistory.length === 0) {
      return {
        currentPrice: 0,
        lowestPrice: 0,
        highestPrice: 0,
        averagePrice: 0,
        total: 0,
      };
    }

    const numericAmounts = allHistory.map((h) => Number(h.amount));
    const lowestPrice = Math.min(...numericAmounts);
    const highestPrice = Math.max(...numericAmounts);
    const currentPrice = numericAmounts[0] ?? 0;
    const sum = numericAmounts.reduce((acc, curr) => acc + curr, 0);
    const averagePrice = Math.round((sum / numericAmounts.length) * 100) / 100;

    return {
      currentPrice,
      lowestPrice,
      highestPrice,
      averagePrice,
      total: allHistory.length,
    };
  }

  async recordPriceChange(data: {
    productId: string;
    variantId?: string | null | undefined;
    amount: number | string;
    currency?: string | undefined;
    source?: string | undefined;
    effectiveDate?: Date | undefined;
    reason?: string | null | undefined;
    changedBy?: string | undefined;
  }) {
    const effectiveDate = data.effectiveDate || new Date();
    const variantId = data.variantId || null;
    const currency = data.currency || 'INR';
    const source = data.source || 'ADMIN_UPDATE';

    // 1. Close out any active historical record where endDate is null or in the future
    await this.db.priceHistory.updateMany({
      where: {
        productId: data.productId,
        variantId: variantId,
        endDate: null,
      },
      data: {
        endDate: effectiveDate,
      },
    });

    // 2. Append new immutable historical record
    return this.db.priceHistory.create({
      data: {
        productId: data.productId,
        variantId: variantId,
        amount: data.amount,
        currency,
        source,
        effectiveDate,
        endDate: null,
        reason: data.reason || null,
        changedBy: data.changedBy || 'system',
      },
    });
  }

  async create(data: CreatePriceDto) {
    const effectiveDate = data.effectiveDate ? new Date(data.effectiveDate) : new Date();

    return this.recordPriceChange({
      productId: data.productId,
      variantId: data.productVariantId || null,
      amount: data.amount,
      currency: data.currency || 'INR',
      source: data.source || 'ADMIN_UPDATE',
      effectiveDate,
      reason: data.reason,
      changedBy: 'admin',
    });
  }
}

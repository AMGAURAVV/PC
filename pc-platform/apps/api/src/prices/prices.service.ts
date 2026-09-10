import { Injectable, NotFoundException } from '@nestjs/common';

import { PaginatedResponse } from '../common/dto/response.dto';

import type {
  CreatePriceDto,
  PriceHistoryItemDto,
  PriceHistoryQueryDto,
  PriceResponseDto,
  ProductPriceSummaryResponseDto,
} from './dto/price.dto';
import type { PricesRepository } from './prices.repository';

@Injectable()
export class PricesService {
  constructor(private readonly pricesRepo: PricesRepository) {}

  async getPriceSummary(productId: string, query: PriceHistoryQueryDto): Promise<ProductPriceSummaryResponseDto> {
    const page = query.page || 1;
    const limit = query.limit || 50;
    const skip = (page - 1) * limit;

    const [metrics, rawHistory] = await Promise.all([
      this.pricesRepo.getPriceMetrics(productId, query.variantId),
      this.pricesRepo.findAllByProduct(productId, skip, limit, query.variantId),
    ]);

    const currency = rawHistory[0]?.currency || 'INR';

    const priceHistory: PriceHistoryItemDto[] = rawHistory.map((h) => this.mapToHistoryItem(h));

    return {
      productId,
      variantId: query.variantId || null,
      currency,
      currentPrice: metrics.currentPrice,
      lowestPrice: metrics.lowestPrice,
      highestPrice: metrics.highestPrice,
      averagePrice: metrics.averagePrice,
      priceHistory,
      total: metrics.total,
    };
  }

  async findAllByProduct(productId: string, query: PriceHistoryQueryDto): Promise<PaginatedResponse<PriceHistoryItemDto>> {
    const page = query.page || 1;
    const limit = query.limit || 50;
    const skip = (page - 1) * limit;

    const [prices, total] = await Promise.all([
      this.pricesRepo.findAllByProduct(productId, skip, limit, query.variantId),
      this.pricesRepo.countAllByProduct(productId, query.variantId),
    ]);

    const data = prices.map((p) => this.mapToHistoryItem(p));
    return PaginatedResponse.ok(data, page, limit, total);
  }

  async findCurrentByProduct(productId: string, variantId?: string): Promise<PriceResponseDto> {
    const price = await this.pricesRepo.findCurrentByProduct(productId, variantId);
    if (!price) {
      throw new NotFoundException('No active price found for this product');
    }
    return this.mapToDto(price);
  }

  async create(createDto: CreatePriceDto): Promise<PriceResponseDto> {
    const price = await this.pricesRepo.create(createDto);
    return this.mapToDto(price);
  }

  private mapToHistoryItem(record: any): PriceHistoryItemDto {
    const amount = Number(record.amount);
    return {
      id: record.id,
      productId: record.productId,
      variantId: record.variantId || null,
      price: amount,
      amount,
      currency: record.currency || 'INR',
      source: record.source || 'ADMIN_UPDATE',
      effectiveDate: record.effectiveDate ? new Date(record.effectiveDate).toISOString() : new Date(record.createdAt).toISOString(),
      endDate: record.endDate ? new Date(record.endDate).toISOString() : null,
      reason: record.reason || null,
      isCorrection: Boolean(record.isCorrection),
      originalAmount: record.originalAmount ? Number(record.originalAmount) : null,
      correctionReason: record.correctionReason || null,
      correctedBy: record.correctedBy || null,
      correctedAt: record.correctedAt ? new Date(record.correctedAt).toISOString() : null,
      createdAt: new Date(record.createdAt).toISOString(),
    };
  }

  private mapToDto(price: any): PriceResponseDto {
    return {
      id: price.id,
      productId: price.productId,
      variantId: price.variantId,
      amount: Number(price.amount),
      currency: price.currency || 'INR',
      source: price.source || 'ADMIN_UPDATE',
      effectiveDate: price.effectiveDate ? new Date(price.effectiveDate).toISOString() : new Date(price.createdAt).toISOString(),
      endDate: price.endDate ? new Date(price.endDate).toISOString() : null,
      createdAt: price.createdAt ? new Date(price.createdAt).toISOString() : new Date().toISOString(),
    };
  }
}

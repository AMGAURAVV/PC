import { Injectable, NotFoundException } from '@nestjs/common';
import { PricesRepository } from './prices.repository';
import { CreatePriceDto, PriceResponseDto } from './dto/price.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginatedResponse } from '../common/dto/response.dto';

@Injectable()
export class PricesService {
  constructor(private readonly pricesRepo: PricesRepository) {}

  async findAllByProduct(productId: string, query: PaginationDto): Promise<PaginatedResponse<PriceResponseDto>> {
    const [prices, total] = await Promise.all([
      this.pricesRepo.findAllByProduct(productId, query.skip, query.limit),
      this.pricesRepo.countAllByProduct(productId),
    ]);

    const data = prices.map((p) => this.mapToDto(p));
    return PaginatedResponse.ok(data, query.page, query.limit, total);
  }

  async findCurrentByProduct(productId: string): Promise<PriceResponseDto> {
    const price = await this.pricesRepo.findCurrentByProduct(productId);
    if (!price) {
      throw new NotFoundException('No active price found for this product');
    }
    return this.mapToDto(price);
  }

  async create(createDto: CreatePriceDto): Promise<PriceResponseDto> {
    const price = await this.pricesRepo.create(createDto);
    return this.mapToDto(price);
  }

  private mapToDto(price: any): PriceResponseDto {
    return {
      id: price.id,
      productId: price.productId,
      variantId: price.variantId,
      amount: Number(price.amount),
      createdAt: price.createdAt.toISOString(),
    };
  }
}

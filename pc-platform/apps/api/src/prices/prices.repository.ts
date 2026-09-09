import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@pc-platform/database';
import { CreatePriceDto } from './dto/price.dto';

@Injectable()
export class PricesRepository {
  constructor(private readonly db: DatabaseService) {}

  async findAllByProduct(productId: string, skip: number, take: number) {
    return this.db.priceHistory.findMany({
      skip,
      take,
      where: { productId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async countAllByProduct(productId: string) {
    return this.db.priceHistory.count({
      where: { productId },
    });
  }

  async findCurrentByProduct(productId: string) {
    return this.db.priceHistory.findFirst({
      where: { 
        productId,
        createdAt: { lte: new Date() }
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: CreatePriceDto) {
    return this.db.priceHistory.create({
      data: {
        productId: data.productId,
        ...(data.productVariantId && { variantId: data.productVariantId }),
        amount: data.amount,
      },
    });
  }
}

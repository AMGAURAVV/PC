import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@pc-platform/database';
import { CreateBuildDto, UpdateBuildDto } from './dto/build.dto';

@Injectable()
export class BuildsRepository {
  constructor(private readonly db: DatabaseService) {}

  async findAllByUser(userId: string, skip: number, take: number) {
    return this.db.build.findMany({
      skip,
      take,
      where: { userId, deletedAt: null },
      include: {
        items: {
          include: {
            product: true,
          }
        }
      },
    });
  }

  async countAllByUser(userId: string) {
    return this.db.build.count({
      where: { userId, deletedAt: null },
    });
  }

  async findById(id: string) {
    return this.db.build.findUnique({
      where: { id, deletedAt: null },
      include: {
        items: {
          include: {
            product: true,
          }
        }
      },
    });
  }

  async create(userId: string, data: CreateBuildDto) {
    return this.db.build.create({
      data: {
        userId,
        name: data.name,
        ...(data.description !== undefined && { description: data.description }),
        totalPriceCache: 0, // In a real app, calculate this based on products
        items: {
          create: data.items.map(item => ({
            productId: item.productId,
            ...(item.productVariantId && { variantId: item.productVariantId }),
            quantity: 1, // default quantity 1 for builds
            priceSnapshot: 0, // calculate later
            componentType: 'CASE' as any, // In reality, fetch from product
          })),
        },
      },
      include: {
        items: true,
      },
    });
  }

  async update(id: string, data: UpdateBuildDto) {
    return this.db.build.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
      },
      include: {
        items: true,
      },
    });
  }

  async delete(id: string) {
    return this.db.build.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}

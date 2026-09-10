import { Injectable } from '@nestjs/common';
import type { DatabaseService } from '@pc-platform/database';

import type { CreateInventoryDto, UpdateInventoryDto } from './dto/inventory.dto';

@Injectable()
export class InventoryRepository {
  constructor(private readonly db: DatabaseService) {}

  async findAll(skip: number, take: number) {
    return this.db.inventory.findMany({
      skip,
      take,
      include: {
        product: true,
      },
    });
  }

  async countAll() {
    return this.db.inventory.count();
  }

  async findById(id: string) {
    return this.db.inventory.findUnique({
      where: { id },
      include: {
        product: true,
      },
    });
  }

  async findByProductId(productId: string) {
    return this.db.inventory.findFirst({
      where: { productId },
    });
  }

  async create(data: CreateInventoryDto) {
    // In a real application, you'd get the supplierId from input or elsewhere
    // Supplying a dummy UUID for compilation purposes.
    const dummySupplierId = '00000000-0000-0000-0000-000000000000';
    return this.db.inventory.create({
      data: {
        productId: data.productId,
        ...(data.productVariantId && { variantId: data.productVariantId }),
        quantity: data.quantity,
        supplierId: dummySupplierId,
      },
    });
  }

  async update(id: string, data: UpdateInventoryDto) {
    return this.db.inventory.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return this.db.inventory.delete({
      where: { id },
    });
  }
}

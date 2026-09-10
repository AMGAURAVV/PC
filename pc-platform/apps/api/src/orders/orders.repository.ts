import { Injectable } from '@nestjs/common';
import type { DatabaseService } from '@pc-platform/database';

import type { CreateOrderDto} from './dto/order.dto';
import { UpdateOrderStatusDto } from './dto/order.dto';

@Injectable()
export class OrdersRepository {
  constructor(private readonly db: DatabaseService) {}

  async findAllByUser(userId: string, skip: number, take: number) {
    return this.db.order.findMany({
      skip,
      take,
      where: { userId },
      include: {
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async countAllByUser(userId: string) {
    return this.db.order.count({
      where: { userId },
    });
  }

  async findAll(skip: number, take: number) {
    return this.db.order.findMany({
      skip,
      take,
      include: {
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async countAll() {
    return this.db.order.count();
  }

  async findById(id: string) {
    return this.db.order.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });
  }

  async create(userId: string, data: CreateOrderDto, totalAmount: number, items: any[]) {
    return this.db.order.create({
      data: {
        userId,
        orderNumber: `ORD-${Date.now()}`,
        subtotal: totalAmount,
        shippingCost: 0,
        taxAmount: 0,
        total: totalAmount,
        status: 'PENDING',
        shippingAddressId: data.shippingAddressId,
        items: {
          create: items.map(item => ({
            productId: item.productId,
            ...(item.productVariantId && { variantId: item.productVariantId }),
            quantity: item.quantity,
            unitPrice: item.priceAtPurchase, // Taking from cart
            totalPrice: item.priceAtPurchase * item.quantity,
            sku: 'UNKNOWN',
            productName: 'UNKNOWN',
          })),
        },
      },
      include: {
        items: true,
      },
    });
  }

  async updateStatus(id: string, status: string) {
    return this.db.order.update({
      where: { id },
      data: { status: status as any },
      include: {
        items: true,
      },
    });
  }
}

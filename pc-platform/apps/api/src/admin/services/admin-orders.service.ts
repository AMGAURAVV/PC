import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { DatabaseService } from '@pc-platform/database';

import { PaginatedResponse } from '../../common/dto/response.dto';
import type { AdminAuditService } from '../admin-audit.service';
import type {
  AdminOrderFilterDto,
  AdminUpdateOrderStatusDto,
  AdminCancelOrderDto,
  AdminRefundOrderDto} from '../dto/admin-order.dto';
import {
  AdminOrderStatus,
} from '../dto/admin-order.dto';

@Injectable()
export class AdminOrdersService {
  constructor(
    private readonly db: DatabaseService,
    private readonly audit: AdminAuditService,
  ) {}

  async findAll(query: AdminOrderFilterDto) {
    const where: any = {};

    if (query.status) {
      where.status = query.status as any;
    }

    if (query.userId) {
      where.userId = query.userId;
    }

    if (query.query || query.search) {
      const q = query.query || query.search;
      where.OR = [
        { orderNumber: { contains: q, mode: 'insensitive' } },
        { user: { email: { contains: q, mode: 'insensitive' } } },
        { user: { firstName: { contains: q, mode: 'insensitive' } } },
        { user: { lastName: { contains: q, mode: 'insensitive' } } },
      ];
    }

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) where.createdAt.gte = new Date(query.startDate);
      if (query.endDate) where.createdAt.lte = new Date(query.endDate);
    }

    const [items, total] = await Promise.all([
      this.db.order.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, email: true, firstName: true, lastName: true } },
          items: {
            include: {
              product: { select: { id: true, name: true, sku: true } },
              variant: { select: { id: true, name: true, sku: true } },
            },
          },
          payments: true,
          shipments: true,
        },
      }),
      this.db.order.count({ where }),
    ]);

    return PaginatedResponse.ok(items, query.page, query.limit, total);
  }

  async findOne(id: string) {
    const order = await this.db.order.findFirst({
      where: { OR: [{ id }, { orderNumber: id }] },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true, phone: true } },
        shippingAddress: true,
        coupon: true,
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                sku: true,
                images: { where: { isPrimary: true }, take: 1 },
              },
            },
            variant: true,
          },
        },
        payments: true,
        shipments: { include: { events: { orderBy: { occurredAt: 'desc' } } } },
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID "${id}" not found`);
    }

    return order;
  }

  async updateStatus(id: string, dto: AdminUpdateOrderStatusDto, actor?: any) {
    const current = await this.findOne(id);

    const updated = await this.db.order.update({
      where: { id: current.id },
      data: {
        status: dto.status as any,
        ...(dto.notes
          ? { notes: `${current.notes ? current.notes + '\n' : ''}[Admin] ${dto.notes}` }
          : {}),
      },
      include: { user: true },
    });

    // If tracking info provided and transitioning to SHIPPED, upsert shipment
    if (dto.status === AdminOrderStatus.SHIPPED && dto.trackingNumber) {
      await this.db.shipment.create({
        data: {
          orderId: current.id,
          trackingNumber: dto.trackingNumber,
          carrier: dto.carrier || 'Standard Courier',
          status: 'IN_TRANSIT',
          events: {
            create: {
              status: 'IN_TRANSIT',
              description: 'Order dispatched by warehouse',
              occurredAt: new Date(),
            },
          },
        },
      });
    }

    await this.audit.record({
      actor,
      action: 'UPDATE',
      entityType: 'Order',
      entityId: current.id,
      entityLabel: `${current.orderNumber} status -> ${dto.status}`,
      before: { status: current.status },
      after: { status: dto.status },
      metadata: { notes: dto.notes, trackingNumber: dto.trackingNumber },
    });

    return updated;
  }

  async cancelOrder(id: string, dto: AdminCancelOrderDto, actor?: any) {
    const current: any = await this.findOne(id);

    if (current.status === 'DELIVERED') {
      throw new BadRequestException('Cannot cancel an order that has already been delivered');
    }

    const updated = await this.db.order.update({
      where: { id: current.id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancellationReason: dto.reason,
      },
    });

    // Optionally restore reserved stock
    if (dto.restockInventory) {
      for (const item of current.items) {
        await this.db.inventory.updateMany({
          where: {
            productId: item.productId,
            variantId: item.variantId || null,
          },
          data: {
            reservedQty: { decrement: item.quantity },
          },
        });
      }
    }

    await this.audit.record({
      actor,
      action: 'UPDATE',
      entityType: 'Order',
      entityId: current.id,
      entityLabel: `${current.orderNumber} CANCELLED`,
      before: { status: current.status },
      after: { status: 'CANCELLED' },
      metadata: { reason: dto.reason, restockInventory: dto.restockInventory },
    });

    return updated;
  }

  async refundOrder(id: string, dto: AdminRefundOrderDto, actor?: any) {
    const current = await this.findOne(id);

    const updated = await this.db.order.update({
      where: { id: current.id },
      data: {
        status: 'REFUNDED',
        notes: `${current.notes ? current.notes + '\n' : ''}[Refund] ${dto.reason} (Amount: ${dto.amount || current.total})`,
      },
    });

    await this.audit.record({
      actor,
      action: 'UPDATE',
      entityType: 'Order',
      entityId: current.id,
      entityLabel: `${current.orderNumber} REFUNDED`,
      before: { status: current.status },
      after: { status: 'REFUNDED' },
      metadata: { refundAmount: dto.amount || current.total, reason: dto.reason },
    });

    return updated;
  }
}

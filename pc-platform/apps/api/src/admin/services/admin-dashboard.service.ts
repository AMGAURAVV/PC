import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@pc-platform/database';

@Injectable()
export class AdminDashboardService {
  constructor(private readonly db: DatabaseService) {}

  async getMetrics() {
    const [
      totalUsers,
      totalOrders,
      totalProducts,
      draftProducts,
      publishedProducts,
      pendingReviews,
      inventoryItems,
      ordersAgg,
      recentOrders,
      recentAuditLogs,
    ] = await Promise.all([
      this.db.user.count({ where: { deletedAt: null } }),
      this.db.order.count(),
      this.db.product.count(),
      this.db.product.count({ where: { isDraft: true } }),
      this.db.product.count({ where: { isActive: true, isDraft: false } }),
      this.db.review.count({ where: { status: 'PENDING' } }),
      this.db.inventory.findMany({ select: { quantity: true, reservedQty: true, lowStockThreshold: true } }),
      this.db.order.aggregate({
        _sum: { total: true },
        where: { status: { notIn: ['CANCELLED', 'REFUNDED', 'FAILED'] } },
      }),
      this.db.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { email: true, firstName: true, lastName: true } } },
      }),
      this.db.auditLog.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const lowStockCount = inventoryItems.filter(
      (i) => i.quantity - i.reservedQty <= i.lowStockThreshold && i.quantity - i.reservedQty > 0,
    ).length;

    const outOfStockCount = inventoryItems.filter(
      (i) => i.quantity - i.reservedQty <= 0,
    ).length;

    return {
      revenue: Number(ordersAgg._sum.total || 0),
      orders: {
        total: totalOrders,
        recent: recentOrders,
      },
      products: {
        total: totalProducts,
        published: publishedProducts,
        draft: draftProducts,
      },
      inventory: {
        lowStockCount,
        outOfStockCount,
      },
      users: {
        total: totalUsers,
      },
      moderation: {
        pendingReviews,
      },
      recentAuditLogs,
    };
  }
}

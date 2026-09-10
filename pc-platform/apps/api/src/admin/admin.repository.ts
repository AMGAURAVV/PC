import { Injectable } from '@nestjs/common';
import type { DatabaseService } from '@pc-platform/database';

@Injectable()
export class AdminRepository {
  constructor(private readonly db: DatabaseService) {}

  async getAuditLogs(skip: number, take: number) {
    return this.db.auditLog.findMany({
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        actor: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
  }

  async countAuditLogs() {
    return this.db.auditLog.count();
  }

  async getDashboardSummary() {
    const [totalUsers, totalOrders, totalProducts] = await Promise.all([
      this.db.user.count(),
      this.db.order.count(),
      this.db.product.count(),
    ]);
    const revenueAgg = await this.db.order.aggregate({
      _sum: {
        total: true,
      },
      where: {
        status: 'DELIVERED',
      },
    });

    return {
      totalUsers,
      totalOrders,
      totalProducts,
      totalRevenue: Number(revenueAgg._sum.total || 0),
    };
  }
}

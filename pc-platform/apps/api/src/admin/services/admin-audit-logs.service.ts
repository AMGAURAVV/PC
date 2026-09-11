import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '@pc-platform/database';

import { PaginatedResponse } from '../../common/dto/response.dto';
import type { AdminAuditLogFilterDto } from '../dto/admin-audit-filter.dto';

@Injectable()
export class AdminAuditLogsService {
  constructor(private readonly db: DatabaseService) {}

  async findAll(query: AdminAuditLogFilterDto) {
    const where: any = {};

    if (query.actorId) {
      where.actorId = query.actorId;
    }

    if (query.action) {
      where.action = query.action as any;
    }

    if (query.entityType) {
      where.entityType = query.entityType;
    }

    if (query.entityId) {
      where.entityId = query.entityId;
    }

    if (query.search) {
      where.OR = [
        { entityLabel: { contains: query.search, mode: 'insensitive' } },
        { actorEmail: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) where.createdAt.gte = new Date(query.startDate);
      if (query.endDate) where.createdAt.lte = new Date(query.endDate);
    }

    const [items, total] = await Promise.all([
      this.db.auditLog.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          actor: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
      }),
      this.db.auditLog.count({ where }),
    ]);

    return PaginatedResponse.ok(items, query.page, query.limit, total);
  }

  async findOne(id: string) {
    const log = await this.db.auditLog.findUnique({
      where: { id },
      include: {
        actor: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });

    if (!log) {
      throw new NotFoundException(`Audit log entry with ID "${id}" not found`);
    }

    return log;
  }
}

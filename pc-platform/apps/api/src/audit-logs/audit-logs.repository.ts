import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@pc-platform/database';
import { CreateAuditLogDto } from './dto/audit-log.dto';

@Injectable()
export class AuditLogsRepository {
  constructor(private readonly db: DatabaseService) {}

  async findAll(skip: number, take: number, actorId?: string, action?: string, entityType?: string) {
    return this.db.auditLog.findMany({
      skip,
      take,
      where: {
        ...(actorId !== undefined && { actorId }),
        ...(action !== undefined && { action: action as any }),
        ...(entityType !== undefined && { entityType }),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async countAll(actorId?: string, action?: string, entityType?: string) {
    return this.db.auditLog.count({
      where: {
        ...(actorId !== undefined && { actorId }),
        ...(action !== undefined && { action: action as any }),
        ...(entityType !== undefined && { entityType }),
      },
    });
  }

  async create(data: CreateAuditLogDto) {
    return this.db.auditLog.create({
      data: {
        action: data.action,
        entityType: data.entityType,
        ...(data.actorId !== undefined && { actorId: data.actorId }),
        ...(data.actorEmail !== undefined && { actorEmail: data.actorEmail }),
        ...(data.entityId !== undefined && { entityId: data.entityId }),
        ...(data.entityLabel !== undefined && { entityLabel: data.entityLabel }),
        ...(data.before !== undefined && { before: data.before }),
        ...(data.after !== undefined && { after: data.after }),
        ...(data.metadata !== undefined && { metadata: data.metadata }),
        ...(data.ipAddress !== undefined && { ipAddress: data.ipAddress }),
      },
    });
  }
}

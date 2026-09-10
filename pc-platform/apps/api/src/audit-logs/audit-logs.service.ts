import { Injectable, Logger } from '@nestjs/common';

import type { AuditLogsRepository } from './audit-logs.repository';
import type { CreateAuditLogDto } from './dto/audit-log.dto';

@Injectable()
export class AuditLogsService {
  private readonly logger = new Logger(AuditLogsService.name);

  constructor(private readonly repository: AuditLogsRepository) {}

  async getAuditLogs(skip: number, take: number, actorId?: string, action?: string, entityType?: string) {
    this.logger.log(`Fetching audit logs`);
    const [items, total] = await Promise.all([
      this.repository.findAll(skip, take, actorId, action, entityType),
      this.repository.countAll(actorId, action, entityType),
    ]);

    return {
      items,
      total,
      page: Math.floor(skip / take) + 1,
      totalPages: Math.ceil(total / take),
    };
  }

  async logAction(data: CreateAuditLogDto) {
    this.logger.log(`Logging action ${data.action} on ${data.entityType}`);
    return this.repository.create(data);
  }
}

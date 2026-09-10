import { Injectable, Logger } from '@nestjs/common';
import type { DatabaseService } from '@pc-platform/database';

export interface AuditRecordParams {
  actor?: { id?: string; email?: string; sub?: string } | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  entityLabel?: string | null;
  before?: any;
  after?: any;
  metadata?: any;
  ipAddress?: string;
}

@Injectable()
export class AdminAuditService {
  private readonly logger = new Logger(AdminAuditService.name);

  constructor(private readonly db: DatabaseService) {}

  /**
   * Records a mutation to the platform audit log.
   */
  async record(params: AuditRecordParams) {
    try {
      const actorId = params.actor?.id || params.actor?.sub || null;
      const actorEmail = params.actor?.email || null;

      const log = await this.db.auditLog.create({
        data: {
          action: params.action as any,
          entityType: params.entityType,
          actorId,
          actorEmail,
          entityId: params.entityId || null,
          entityLabel: params.entityLabel || null,
          before: params.before ? JSON.parse(JSON.stringify(params.before)) : null,
          after: params.after ? JSON.parse(JSON.stringify(params.after)) : null,
          metadata: params.metadata ? JSON.parse(JSON.stringify(params.metadata)) : null,
          ipAddress: params.ipAddress || null,
        },
      });

      return log;
    } catch (err) {
      // Don't let audit failure fail the primary transaction, but log an error
      this.logger.error(`Failed to record audit log for ${params.action} on ${params.entityType}: ${err instanceof Error ? err.message : String(err)}`);
      return null;
    }
  }
}

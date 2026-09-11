import { Injectable } from '@nestjs/common';

import type { PaginationDto } from '../common/dto/pagination.dto';
import { PaginatedResponse } from '../common/dto/response.dto';

import { AdminRepository } from './admin.repository';
import type { AuditLogResponseDto, DashboardSummaryDto } from './dto/admin.dto';

@Injectable()
export class AdminService {
  constructor(private readonly adminRepo: AdminRepository) {}

  async getAuditLogs(query: PaginationDto): Promise<PaginatedResponse<AuditLogResponseDto>> {
    const [logs, total] = await Promise.all([
      this.adminRepo.getAuditLogs(query.skip, query.limit),
      this.adminRepo.countAuditLogs(),
    ]);

    const data = logs.map(this.mapToAuditLogDto);
    return PaginatedResponse.ok(data, query.page, query.limit, total);
  }

  async getDashboardSummary(): Promise<DashboardSummaryDto> {
    return this.adminRepo.getDashboardSummary();
  }

  private mapToAuditLogDto(log: any): AuditLogResponseDto {
    return {
      id: log.id,
      actorId: log.actorId,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      details: log.details,
      ipAddress: log.ipAddress,
      createdAt: log.createdAt.toISOString(),
    };
  }
}

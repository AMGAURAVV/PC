import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { AdminAuditLogFilterDto } from '../dto/admin-audit-filter.dto';
import type { AdminAuditLogsService } from '../services/admin-audit-logs.service';

@ApiTags('admin-audit-logs')
@ApiBearerAuth('access-token')
@UseGuards(RolesGuard)
@Roles('super_admin', 'admin')
@Controller('admin/audit-logs')
export class AdminAuditLogsController {
  constructor(private readonly auditLogsService: AdminAuditLogsService) {}

  @Get()
  @ApiOperation({ summary: 'Search and filter platform audit logs by actor, action, entity, date range' })
  findAll(@Query() query: AdminAuditLogFilterDto) {
    return this.auditLogsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get full audit log record with before/after state diffs' })
  findOne(@Param('id') id: string) {
    return this.auditLogsService.findOne(id);
  }
}

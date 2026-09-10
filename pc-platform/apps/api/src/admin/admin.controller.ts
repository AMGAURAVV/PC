import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse as SwaggerResponse } from '@nestjs/swagger';

import { Roles } from '../common/decorators/roles.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';
import { RolesGuard } from '../common/guards/roles.guard';

import type { AdminService } from './admin.service';
import { DashboardSummaryDto } from './dto/admin.dto';

@ApiTags('admin')
@ApiBearerAuth('access-token')
@UseGuards(RolesGuard)
@Roles('super_admin', 'admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard-summary')
  @ApiOperation({ summary: 'Get high-level dashboard metrics' })
  @SwaggerResponse({ status: 200, type: DashboardSummaryDto })
  getDashboardSummary() {
    return this.adminService.getDashboardSummary();
  }
}

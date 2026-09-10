import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { AdminDashboardService } from '../services/admin-dashboard.service';

@ApiTags('admin-dashboard')
@ApiBearerAuth('access-token')
@UseGuards(RolesGuard)
@Roles('super_admin', 'admin')
@Controller('admin/dashboard')
export class AdminDashboardController {
  constructor(private readonly dashboardService: AdminDashboardService) {}

  @Get()
  @ApiOperation({ summary: 'Get comprehensive platform KPI metrics' })
  getDashboard() {
    return this.dashboardService.getMetrics();
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Get comprehensive platform KPI metrics, revenue, inventory alerts, and activity feed' })
  getMetrics() {
    return this.dashboardService.getMetrics();
  }
}

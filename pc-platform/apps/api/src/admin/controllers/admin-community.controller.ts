import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import {
  AdminCommunityFilterDto,
  ModerateCommunityBuildDto,
  ResolveCommunityReportDto,
} from '../dto/admin-community.dto';
import { AdminCommunityService } from '../services/admin-community.service';

@ApiTags('admin-community')
@ApiBearerAuth('access-token')
@UseGuards(RolesGuard)
@Roles('super_admin', 'admin')
@Controller('admin/community')
export class AdminCommunityController {
  constructor(private readonly communityService: AdminCommunityService) {}

  @Get('builds')
  @ApiOperation({ summary: 'List and filter community builds for moderation (PENDING, APPROVED, HIDDEN, REMOVED)' })
  findAll(@Query() query: AdminCommunityFilterDto) {
    return this.communityService.findAll(query);
  }

  @Patch('builds/:id/moderate')
  @ApiOperation({ summary: 'Execute moderation action on a community build (approve, hide, remove, feature)' })
  moderate(
    @Param('id') id: string,
    @CurrentUser() actor: any,
    @Body() dto: ModerateCommunityBuildDto,
  ) {
    return this.communityService.moderate(id, dto, actor);
  }

  @Get('reports')
  @ApiOperation({ summary: 'List all community build violation reports' })
  findReports() {
    return this.communityService.findReports();
  }

  @Patch('reports/:id/resolve')
  @ApiOperation({ summary: 'Resolve or dismiss a community report' })
  resolveReport(
    @Param('id') id: string,
    @CurrentUser() actor: any,
    @Body() dto: ResolveCommunityReportDto,
  ) {
    return this.communityService.resolveReport(id, dto, actor);
  }
}

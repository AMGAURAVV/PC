import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import {
  AdminUserFilterDto,
  AdminUpdateUserStatusDto,
  AdminAssignRolesDto,
  BulkUserStatusDto,
} from '../dto/admin-user.dto';
import { AdminUsersService } from '../services/admin-users.service';

@ApiTags('admin-users')
@ApiBearerAuth('access-token')
@UseGuards(RolesGuard)
@Roles('super_admin', 'admin')
@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly usersService: AdminUsersService) {}

  @Get()
  @ApiOperation({ summary: 'List and search platform users with status and role filters' })
  findAll(@Query() query: AdminUserFilterDto) {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user details with associated orders and activity' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Activate, suspend, or deactivate user account' })
  updateStatus(
    @Param('id') id: string,
    @CurrentUser() actor: any,
    @Body() dto: AdminUpdateUserStatusDto,
  ) {
    return this.usersService.updateStatus(id, dto, actor);
  }

  @Patch(':id/roles')
  @ApiOperation({ summary: 'Assign security roles to user (Admin and Super Admin)' })
  assignRoles(
    @Param('id') id: string,
    @CurrentUser() actor: any,
    @Body() dto: AdminAssignRolesDto,
  ) {
    return this.usersService.assignRoles(id, dto, actor);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Safely delete or soft-deactivate user account' })
  remove(@Param('id') id: string, @CurrentUser() actor: any, @Query('force') force?: boolean) {
    return this.usersService.delete(id, actor, force);
  }

  @Post('bulk/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Batch update user statuses (e.g. bulk suspension)' })
  bulkStatus(@CurrentUser() actor: any, @Body() dto: BulkUserStatusDto) {
    return this.usersService.bulkStatus(dto, actor);
  }
}

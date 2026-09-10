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
import type {
  CreateCouponDto,
  UpdateCouponDto,
  BulkCouponStatusDto,
  CouponFilterDto,
} from '../dto/admin-coupon.dto';
import type { AdminCouponsService } from '../services/admin-coupons.service';

@ApiTags('admin-coupons')
@ApiBearerAuth('access-token')
@UseGuards(RolesGuard)
@Roles('super_admin', 'admin')
@Controller('admin/coupons')
export class AdminCouponsController {
  constructor(private readonly couponsService: AdminCouponsService) {}

  @Get()
  @ApiOperation({ summary: 'List and filter promotional coupons with usage statistics' })
  findAll(@Query() query: CouponFilterDto) {
    return this.couponsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get coupon details with redemption history' })
  findOne(@Param('id') id: string) {
    return this.couponsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new discount coupon code' })
  create(@CurrentUser() actor: any, @Body() dto: CreateCouponDto) {
    return this.couponsService.create(dto, actor);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update coupon configuration' })
  update(@Param('id') id: string, @CurrentUser() actor: any, @Body() dto: UpdateCouponDto) {
    return this.couponsService.update(id, dto, actor);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Safely delete or deactivate a coupon (preserves used coupon history)' })
  remove(@Param('id') id: string, @CurrentUser() actor: any, @Query('force') force?: boolean) {
    return this.couponsService.delete(id, actor, force);
  }

  @Post('bulk/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Batch activate or deactivate coupons' })
  bulkStatus(@CurrentUser() actor: any, @Body() dto: BulkCouponStatusDto) {
    return this.couponsService.bulkStatus(dto, actor);
  }
}

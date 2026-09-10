import {
  Body,
  Controller,
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
  AdminOrderFilterDto,
  AdminUpdateOrderStatusDto,
  AdminCancelOrderDto,
  AdminRefundOrderDto,
} from '../dto/admin-order.dto';
import type { AdminOrdersService } from '../services/admin-orders.service';

@ApiTags('admin-orders')
@ApiBearerAuth('access-token')
@UseGuards(RolesGuard)
@Roles('super_admin', 'admin')
@Controller('admin/orders')
export class AdminOrdersController {
  constructor(private readonly ordersService: AdminOrdersService) {}

  @Get()
  @ApiOperation({ summary: 'List and search customer orders with status, date, and customer filters' })
  findAll(@Query() query: AdminOrderFilterDto) {
    return this.ordersService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get complete order details including items, payments, and shipment events' })
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Transition order status (CONFIRMED, PROCESSING, SHIPPED, DELIVERED)' })
  updateStatus(
    @Param('id') id: string,
    @CurrentUser() actor: any,
    @Body() dto: AdminUpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(id, dto, actor);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel an order with reason and optional stock reservation release' })
  cancelOrder(
    @Param('id') id: string,
    @CurrentUser() actor: any,
    @Body() dto: AdminCancelOrderDto,
  ) {
    return this.ordersService.cancelOrder(id, dto, actor);
  }

  @Post(':id/refund')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Issue full or partial refund for an order' })
  refundOrder(
    @Param('id') id: string,
    @CurrentUser() actor: any,
    @Body() dto: AdminRefundOrderDto,
  ) {
    return this.ordersService.refundOrder(id, dto, actor);
  }
}

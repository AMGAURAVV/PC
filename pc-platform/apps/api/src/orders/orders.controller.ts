import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse as SwaggerResponse } from '@nestjs/swagger';

import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';
import { RolesGuard } from '../common/guards/roles.guard';

import { CheckoutOrderDto, CheckoutSummaryDto } from './dto/checkout.dto';
import { CreateOrderDto, UpdateOrderStatusDto, OrderResponseDto } from './dto/order.dto';
import { OrdersService } from './orders.service';


@ApiTags('orders')
@ApiBearerAuth('access-token')
@UseGuards(RolesGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('checkout-summary')
  @ApiOperation({ summary: 'Calculate authoritative checkout totals and discounts' })
  async checkoutSummary(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CheckoutSummaryDto,
  ) {
    const data = await this.ordersService.getCheckoutSummary(user.sub, dto);
    return { success: true, data };
  }

  @Post('checkout')
  @ApiOperation({ summary: 'Execute authoritative 7-step checkout and create order' })
  async checkout(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CheckoutOrderDto,
  ) {
    const data = await this.ordersService.checkout(user.sub, dto);
    return { success: true, data };
  }

  @Post()
  @ApiOperation({ summary: 'Create a new order from current active cart' })
  @SwaggerResponse({ status: 201, type: OrderResponseDto })
  create(@CurrentUser() user: JwtPayload, @Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.createFromCart(user.sub, createOrderDto);
  }

  @Get('my-orders')
  @ApiOperation({ summary: 'List all orders for current user' })
  findAllByUser(@CurrentUser() user: JwtPayload, @Query() query: PaginationDto) {
    return this.ordersService.findAllByUser(user.sub, query);
  }

  @Get()
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'List all orders in the system (Admin only)' })
  findAll(@Query() query: PaginationDto) {
    return this.ordersService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an order by ID' })
  @SwaggerResponse({ status: 200, type: OrderResponseDto })
  findOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    const isAdmin = (user.roles ?? []).some(
      (r) => r.toUpperCase() === 'ADMIN' || r.toUpperCase() === 'SUPER_ADMIN',
    );
    return this.ordersService.findOne(id, user.sub, isAdmin);
  }

  @Patch(':id/status')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Update order status (Admin only)' })
  @SwaggerResponse({ status: 200, type: OrderResponseDto })
  updateStatus(@Param('id') id: string, @Body() updateOrderStatusDto: UpdateOrderStatusDto) {
    return this.ordersService.updateStatus(id, updateOrderStatusDto);
  }
}

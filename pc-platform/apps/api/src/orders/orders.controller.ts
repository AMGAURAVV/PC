import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse as SwaggerResponse } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto, UpdateOrderStatusDto, OrderResponseDto } from './dto/order.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@ApiTags('orders')
@ApiBearerAuth('access-token')
@UseGuards(RolesGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

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
    const isAdmin = user.roles.includes('admin') || user.roles.includes('super_admin');
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

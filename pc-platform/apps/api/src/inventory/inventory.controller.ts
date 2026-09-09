import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse as SwaggerResponse } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { CreateInventoryDto, UpdateInventoryDto, InventoryResponseDto } from './dto/inventory.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('inventory')
@ApiBearerAuth('access-token')
@UseGuards(RolesGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post()
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Create an inventory record (Admin only)' })
  create(@Body() createInventoryDto: CreateInventoryDto) {
    return this.inventoryService.create(createInventoryDto);
  }

  @Get()
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'List all inventory (Admin only)' })
  findAll(@Query() query: PaginationDto) {
    return this.inventoryService.findAll(query);
  }

  @Get('product/:productId')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Get inventory by product ID (Admin only)' })
  @SwaggerResponse({ status: 200, type: InventoryResponseDto })
  findByProduct(@Param('productId') productId: string) {
    return this.inventoryService.findByProduct(productId);
  }

  @Get(':id')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Get inventory by ID (Admin only)' })
  @SwaggerResponse({ status: 200, type: InventoryResponseDto })
  findOne(@Param('id') id: string) {
    return this.inventoryService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Update inventory (Admin only)' })
  @SwaggerResponse({ status: 200, type: InventoryResponseDto })
  update(@Param('id') id: string, @Body() updateInventoryDto: UpdateInventoryDto) {
    return this.inventoryService.update(id, updateInventoryDto);
  }

  @Delete(':id')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Delete inventory (Admin only)' })
  remove(@Param('id') id: string) {
    return this.inventoryService.remove(id);
  }
}

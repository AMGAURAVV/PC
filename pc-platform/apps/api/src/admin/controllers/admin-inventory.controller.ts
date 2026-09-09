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
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AdminInventoryService } from '../services/admin-inventory.service';
import {
  AdminInventoryFilterDto,
  StockAdjustmentDto,
  BulkStockAdjustmentDto,
  UpdateStockThresholdDto,
} from '../dto/admin-inventory.dto';

@ApiTags('admin-inventory')
@ApiBearerAuth('access-token')
@UseGuards(RolesGuard)
@Roles('super_admin', 'admin')
@Controller('admin/inventory')
export class AdminInventoryController {
  constructor(private readonly inventoryService: AdminInventoryService) {}

  @Get()
  @ApiOperation({ summary: 'List and filter warehouse inventory with stock status metrics' })
  findAll(@Query() query: AdminInventoryFilterDto) {
    return this.inventoryService.findAll(query);
  }

  @Get('product/:productId')
  @ApiOperation({ summary: 'Get stock inventory breakdown for a specific product' })
  findByProduct(@Param('productId') productId: string) {
    return this.inventoryService.findByProduct(productId);
  }

  @Post('adjust')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Perform stock adjustment (restock, correction, damage) with full audit log' })
  adjustStock(@CurrentUser() actor: any, @Body() dto: StockAdjustmentDto) {
    return this.inventoryService.adjustStock(dto, actor);
  }

  @Post(['bulk-adjust', 'bulk/adjust'])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Batch perform stock adjustments across multiple items' })
  bulkAdjust(@CurrentUser() actor: any, @Body() dto: BulkStockAdjustmentDto) {
    return this.inventoryService.bulkAdjust(dto, actor);
  }

  @Patch(':id/threshold')
  @ApiOperation({ summary: 'Update low stock alert threshold for an inventory item' })
  updateThreshold(
    @Param('id') id: string,
    @CurrentUser() actor: any,
    @Body() dto: UpdateStockThresholdDto,
  ) {
    return this.inventoryService.updateThreshold(id, dto, actor);
  }
}

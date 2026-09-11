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
import {
  AdminCreatePriceDto,
  AdminUpdatePriceDto,
  AdminCorrectPriceHistoryDto,
  BulkPriceUpdateDto,
  PriceHistoryFilterDto,
} from '../dto/admin-price.dto';
import { AdminPricesService } from '../services/admin-prices.service';

@ApiTags('admin-prices')
@ApiBearerAuth('access-token')
@UseGuards(RolesGuard)
@Roles('super_admin', 'admin')
@Controller('admin/prices')
export class AdminPricesController {
  constructor(private readonly pricesService: AdminPricesService) {}

  @Post()
  @ApiOperation({ summary: 'Add a new pricing tier or scheduled promo price with automatic audit history' })
  createPrice(@CurrentUser() actor: any, @Body() dto: AdminCreatePriceDto) {
    return this.pricesService.createPrice(dto, actor);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing price with automatic PriceHistory tracking' })
  updatePrice(
    @Param('id') id: string,
    @CurrentUser() actor: any,
    @Body() dto: AdminUpdatePriceDto,
  ) {
    return this.pricesService.updatePrice(id, dto, actor);
  }

  @Post(['bulk-update', 'bulk'])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Batch update prices across multiple products by percentage or fixed amount' })
  bulkUpdatePrices(@CurrentUser() actor: any, @Body() dto: BulkPriceUpdateDto) {
    return this.pricesService.bulkUpdatePrices(dto, actor);
  }

  @Get('history')
  @ApiOperation({ summary: 'Query comprehensive price history timeline across products and variants' })
  getPriceHistory(@Query() query: PriceHistoryFilterDto) {
    return this.pricesService.getPriceHistory(query);
  }

  @Patch('history/:id/correct')
  @ApiOperation({ summary: 'Perform authorized administrative correction on an invalid historical price record' })
  correctHistoricalPrice(
    @Param('id') id: string,
    @CurrentUser() actor: any,
    @Body() dto: AdminCorrectPriceHistoryDto,
  ) {
    return this.pricesService.correctHistoricalPrice(id, dto, actor);
  }
}

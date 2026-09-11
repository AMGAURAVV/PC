import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse as SwaggerResponse } from '@nestjs/swagger';

import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

import {
  CreatePriceDto,
  PriceHistoryQueryDto,
  PriceResponseDto,
  ProductPriceSummaryResponseDto,
} from './dto/price.dto';
import { PricesService } from './prices.service';


@ApiTags('prices')
@Controller('prices')
export class PricesController {
  constructor(private readonly pricesService: PricesService) {}

  @Post()
  @ApiBearerAuth('access-token')
  @UseGuards(RolesGuard)
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Create a new price record (Admin only)' })
  create(@Body() createPriceDto: CreatePriceDto) {
    return this.pricesService.create(createPriceDto);
  }

  @Get('product/:productId/summary')
  @Public()
  @ApiOperation({ summary: 'Get current, lowest, highest price and complete price history for a product' })
  @SwaggerResponse({ status: 200, type: ProductPriceSummaryResponseDto })
  getPriceSummary(
    @Param('productId') productId: string,
    @Query() query: PriceHistoryQueryDto,
  ): Promise<ProductPriceSummaryResponseDto> {
    return this.pricesService.getPriceSummary(productId, query);
  }

  @Get('product/:productId/history')
  @Public()
  @ApiOperation({ summary: 'Get price history and summary metrics for a product' })
  @SwaggerResponse({ status: 200, type: ProductPriceSummaryResponseDto })
  findAllByProduct(
    @Param('productId') productId: string,
    @Query() query: PriceHistoryQueryDto,
  ): Promise<ProductPriceSummaryResponseDto> {
    return this.pricesService.getPriceSummary(productId, query);
  }

  @Get('product/:productId/current')
  @Public()
  @ApiOperation({ summary: 'Get current active price for a product' })
  @SwaggerResponse({ status: 200, type: PriceResponseDto })
  findCurrentByProduct(
    @Param('productId') productId: string,
    @Query('variantId') variantId?: string,
  ) {
    return this.pricesService.findCurrentByProduct(productId, variantId);
  }
}

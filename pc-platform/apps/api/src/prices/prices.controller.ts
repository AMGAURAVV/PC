import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse as SwaggerResponse } from '@nestjs/swagger';
import { PricesService } from './prices.service';
import { CreatePriceDto, PriceResponseDto } from './dto/price.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';

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

  @Get('product/:productId/history')
  @Public()
  @ApiOperation({ summary: 'Get price history for a product' })
  findAllByProduct(@Param('productId') productId: string, @Query() query: PaginationDto) {
    return this.pricesService.findAllByProduct(productId, query);
  }

  @Get('product/:productId/current')
  @Public()
  @ApiOperation({ summary: 'Get current active price for a product' })
  @SwaggerResponse({ status: 200, type: PriceResponseDto })
  findCurrentByProduct(@Param('productId') productId: string) {
    return this.pricesService.findCurrentByProduct(productId);
  }
}

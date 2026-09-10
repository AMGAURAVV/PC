import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse as SwaggerResponse, ApiQuery } from '@nestjs/swagger';

import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import type { PaginationDto } from '../common/dto/pagination.dto';
import { RolesGuard } from '../common/guards/roles.guard';

import type { BrandsService } from './brands.service';
import type { CreateBrandDto, UpdateBrandDto} from './dto/brand.dto';
import { BrandResponseDto } from './dto/brand.dto';

@ApiTags('brands')
@Controller('brands')
export class BrandsController {
  constructor(private readonly brandsService: BrandsService) {}

  @Post()
  @ApiBearerAuth('access-token')
  @UseGuards(RolesGuard)
  @Roles('admin', 'staff', 'editor')
  @ApiOperation({ summary: 'Create a new hardware brand (Admin / Staff / Editor)' })
  create(@Body() createBrandDto: CreateBrandDto) {
    return this.brandsService.create(createBrandDto);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'List all brands with pagination and product counts' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'search', required: false, type: String })
  @SwaggerResponse({ status: 200, type: [BrandResponseDto] })
  findAll(
    @Query() query: PaginationDto,
    @Query('isActive') isActive?: boolean,
    @Query('search') search?: string,
  ) {
    return this.brandsService.findAll(query, isActive, search);
  }

  @Get('slug/:slug')
  @Public()
  @ApiOperation({ summary: 'Get a brand by slug' })
  @SwaggerResponse({ status: 200, type: BrandResponseDto })
  findBySlug(@Param('slug') slug: string) {
    return this.brandsService.findBySlug(slug);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get a brand by ID' })
  @SwaggerResponse({ status: 200, type: BrandResponseDto })
  findOne(@Param('id') id: string) {
    return this.brandsService.findOne(id);
  }

  @Patch(':id')
  @ApiBearerAuth('access-token')
  @UseGuards(RolesGuard)
  @Roles('admin', 'staff', 'editor')
  @ApiOperation({ summary: 'Update a brand (Admin / Staff / Editor)' })
  @SwaggerResponse({ status: 200, type: BrandResponseDto })
  update(@Param('id') id: string, @Body() updateBrandDto: UpdateBrandDto) {
    return this.brandsService.update(id, updateBrandDto);
  }

  @Delete(':id')
  @ApiBearerAuth('access-token')
  @UseGuards(RolesGuard)
  @Roles('admin', 'staff')
  @ApiOperation({ summary: 'Delete a brand (Admin / Staff)' })
  remove(@Param('id') id: string) {
    return this.brandsService.remove(id);
  }
}

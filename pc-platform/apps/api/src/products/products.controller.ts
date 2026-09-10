import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Put,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse as SwaggerResponse,
} from '@nestjs/swagger';

import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

import type {
  CompareProductsQueryDto} from './dto/product-compare.dto';
import {
  ProductComparisonResponseDto,
} from './dto/product-compare.dto';
import type { ProductFilterDto } from './dto/product-filter.dto';
import type { CreateProductImageDto } from './dto/product-image.dto';
import type {
  CreateProductVariantDto,
  UpdateProductVariantDto,
} from './dto/product-variant.dto';
import type {
  CreateProductDto,
  UpdateProductDto} from './dto/product.dto';
import {
  ProductResponseDto,
} from './dto/product.dto';
import type { ProductsService } from './products.service';


@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // ── Public Catalog & Search ─────────────────────────────────────────────────

  @Get()
  @Public()
  @ApiOperation({
    summary: 'List & search products with hardware-specific filters, sorting, and pagination',
  })
  @SwaggerResponse({ status: 200, type: [ProductResponseDto] })
  findAll(@Query() filterDto: ProductFilterDto) {
    return this.productsService.findAll(filterDto);
  }

  @Get('compare')
  @Public()
  @ApiOperation({
    summary: 'Compare 2 to 5 products side-by-side with spec difference detection',
  })
  @SwaggerResponse({ status: 200, type: ProductComparisonResponseDto })
  compareProducts(@Query() query: CompareProductsQueryDto) {
    return this.productsService.compareProducts(query.ids);
  }

  @Get('slug/:slug')
  @Public()
  @ApiOperation({ summary: 'Get product details by URL slug' })
  @SwaggerResponse({ status: 200, type: ProductResponseDto })
  findBySlug(@Param('slug') slug: string) {
    return this.productsService.findBySlug(slug);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get product details by ID' })
  @SwaggerResponse({ status: 200, type: ProductResponseDto })
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  // ── Product Lifecycle Management ────────────────────────────────────────────

  @Post()
  @ApiBearerAuth('access-token')
  @UseGuards(RolesGuard)
  @Roles('admin', 'staff', 'editor')
  @ApiOperation({ summary: 'Create a new product (Staff / Editor / Admin)' })
  @SwaggerResponse({ status: 201, type: ProductResponseDto })
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Patch(':id')
  @ApiBearerAuth('access-token')
  @UseGuards(RolesGuard)
  @Roles('admin', 'staff', 'editor')
  @ApiOperation({ summary: 'Update an existing product (Staff / Editor / Admin)' })
  @SwaggerResponse({ status: 200, type: ProductResponseDto })
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(id, updateProductDto);
  }

  @Patch(':id/publish')
  @ApiBearerAuth('access-token')
  @UseGuards(RolesGuard)
  @Roles('admin', 'staff', 'editor')
  @ApiOperation({ summary: 'Publish a draft or inactive product to the live catalog' })
  @SwaggerResponse({ status: 200, type: ProductResponseDto })
  publish(@Param('id') id: string) {
    return this.productsService.publish(id);
  }

  @Patch(':id/archive')
  @ApiBearerAuth('access-token')
  @UseGuards(RolesGuard)
  @Roles('admin', 'staff', 'editor')
  @ApiOperation({ summary: 'Archive a product from the live catalog' })
  @SwaggerResponse({ status: 200, type: ProductResponseDto })
  archive(@Param('id') id: string) {
    return this.productsService.archive(id);
  }

  @Delete(':id')
  @ApiBearerAuth('access-token')
  @UseGuards(RolesGuard)
  @Roles('admin', 'staff')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft-delete / remove a product (Staff / Admin)' })
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }

  // ── Product Variants Management ─────────────────────────────────────────────

  @Post(':id/variants')
  @ApiBearerAuth('access-token')
  @UseGuards(RolesGuard)
  @Roles('admin', 'staff', 'editor')
  @ApiOperation({ summary: 'Add a new variant to a product' })
  addVariant(
    @Param('id') productId: string,
    @Body() createVariantDto: CreateProductVariantDto,
  ) {
    return this.productsService.addVariant(productId, createVariantDto);
  }

  @Patch(':id/variants/:variantId')
  @ApiBearerAuth('access-token')
  @UseGuards(RolesGuard)
  @Roles('admin', 'staff', 'editor')
  @ApiOperation({ summary: 'Update an existing product variant' })
  updateVariant(
    @Param('id') productId: string,
    @Param('variantId') variantId: string,
    @Body() updateVariantDto: UpdateProductVariantDto,
  ) {
    return this.productsService.updateVariant(productId, variantId, updateVariantDto);
  }

  @Delete(':id/variants/:variantId')
  @ApiBearerAuth('access-token')
  @UseGuards(RolesGuard)
  @Roles('admin', 'staff', 'editor')
  @ApiOperation({ summary: 'Remove a product variant' })
  removeVariant(
    @Param('id') productId: string,
    @Param('variantId') variantId: string,
  ) {
    return this.productsService.removeVariant(productId, variantId);
  }

  // ── Product Images Management ───────────────────────────────────────────────

  @Post(':id/images')
  @ApiBearerAuth('access-token')
  @UseGuards(RolesGuard)
  @Roles('admin', 'staff', 'editor')
  @ApiOperation({ summary: 'Add an image to product gallery' })
  addImage(
    @Param('id') productId: string,
    @Body() createImageDto: CreateProductImageDto,
  ) {
    return this.productsService.addImage(productId, createImageDto);
  }

  @Delete(':id/images/:imageId')
  @ApiBearerAuth('access-token')
  @UseGuards(RolesGuard)
  @Roles('admin', 'staff', 'editor')
  @ApiOperation({ summary: 'Delete an image from product gallery' })
  removeImage(
    @Param('id') productId: string,
    @Param('imageId') imageId: string,
  ) {
    return this.productsService.removeImage(productId, imageId);
  }

  @Patch(':id/images/:imageId/primary')
  @ApiBearerAuth('access-token')
  @UseGuards(RolesGuard)
  @Roles('admin', 'staff', 'editor')
  @ApiOperation({ summary: 'Set an image as the primary product thumbnail' })
  setPrimaryImage(
    @Param('id') productId: string,
    @Param('imageId') imageId: string,
  ) {
    return this.productsService.setPrimaryImage(productId, imageId);
  }

  // ── Component Specifications Upsert ─────────────────────────────────────────

  @Put(':id/specifications/:componentType')
  @ApiBearerAuth('access-token')
  @UseGuards(RolesGuard)
  @Roles('admin', 'staff', 'editor')
  @ApiOperation({
    summary: 'Upsert structured hardware specifications for a component',
  })
  upsertSpecification(
    @Param('id') productId: string,
    @Param('componentType') componentType: string,
    @Body() specData: Record<string, any>,
  ) {
    return this.productsService.upsertSpecification(productId, componentType, specData);
  }
}

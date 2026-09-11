import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import {
  AdminProductFilterDto,
  AdminCreateProductDto,
  AdminUpdateProductDto,
  BulkProductStatusDto,
  BulkProductDeleteDto,
} from '../dto/admin-product.dto';
import { AdminProductsService } from '../services/admin-products.service';

@ApiTags('admin-products')
@ApiBearerAuth('access-token')
@UseGuards(RolesGuard)
@Roles('super_admin', 'admin')
@Controller('admin/products')
export class AdminProductsController {
  constructor(private readonly productsService: AdminProductsService) {}

  @Get()
  @ApiOperation({ summary: 'List and filter catalog products for admin with full draft/published controls' })
  findAll(@Query() query: AdminProductFilterDto) {
    return this.productsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single product with complete specifications and relational data' })
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new product (draft or published) with pricing and initial stock' })
  create(@CurrentUser() actor: any, @Body() dto: AdminCreateProductDto) {
    return this.productsService.create(dto, actor);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update product details with optimistic concurrency support' })
  update(@Param('id') id: string, @CurrentUser() actor: any, @Body() dto: AdminUpdateProductDto) {
    return this.productsService.update(id, dto, actor);
  }

  @Patch(':id/publish')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Publish product making it live in public catalog' })
  publish(@Param('id') id: string, @CurrentUser() actor: any) {
    return this.productsService.publish(id, actor);
  }

  @Patch(':id/archive')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Archive product removing it from live public catalog' })
  archive(@Param('id') id: string, @CurrentUser() actor: any) {
    return this.productsService.archive(id, actor);
  }

  @Patch(':id/draft')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revert product to draft status' })
  draft(@Param('id') id: string, @CurrentUser() actor: any) {
    return this.productsService.draft(id, actor);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Safely delete or soft-archive a product' })
  remove(@Param('id') id: string, @CurrentUser() actor: any, @Query('force') force?: boolean) {
    return this.productsService.delete(id, actor, force);
  }

  @Post('bulk/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Batch publish, archive, draft, or feature products' })
  bulkStatus(@CurrentUser() actor: any, @Body() dto: BulkProductStatusDto) {
    return this.productsService.bulkStatus(dto, actor);
  }

  @Post('bulk/delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Batch safely delete products' })
  bulkDelete(@CurrentUser() actor: any, @Body() dto: BulkProductDeleteDto) {
    return this.productsService.bulkDelete(dto, actor);
  }

  // ── Variants ──
  @Post(':id/variants')
  @ApiOperation({ summary: 'Add a new variant to product' })
  addVariant(@Param('id') id: string, @CurrentUser() actor: any, @Body() dto: any) {
    return this.productsService.addVariant(id, dto, actor);
  }

  @Patch(':id/variants/:variantId')
  @ApiOperation({ summary: 'Update an existing variant' })
  updateVariant(
    @Param('id') id: string,
    @Param('variantId') variantId: string,
    @CurrentUser() actor: any,
    @Body() dto: any,
  ) {
    return this.productsService.updateVariant(id, variantId, dto, actor);
  }

  @Delete(':id/variants/:variantId')
  @ApiOperation({ summary: 'Delete a variant' })
  deleteVariant(
    @Param('id') id: string,
    @Param('variantId') variantId: string,
    @CurrentUser() actor: any,
  ) {
    return this.productsService.deleteVariant(id, variantId, actor);
  }

  // ── Images ──
  @Post(':id/images')
  @ApiOperation({ summary: 'Add an image to product gallery' })
  addImage(@Param('id') id: string, @CurrentUser() actor: any, @Body() dto: any) {
    return this.productsService.addImage(id, dto, actor);
  }

  @Patch(':id/images/:imageId/primary')
  @ApiOperation({ summary: 'Promote an image to primary' })
  setPrimaryImage(
    @Param('id') id: string,
    @Param('imageId') imageId: string,
    @CurrentUser() actor: any,
  ) {
    return this.productsService.setPrimaryImage(id, imageId, actor);
  }

  @Delete(':id/images/:imageId')
  @ApiOperation({ summary: 'Delete a gallery image' })
  deleteImage(
    @Param('id') id: string,
    @Param('imageId') imageId: string,
    @CurrentUser() actor: any,
  ) {
    return this.productsService.deleteImage(id, imageId, actor);
  }

  // ── Specifications ──
  @Put(':id/specifications/:componentType')
  @ApiOperation({ summary: 'Upsert structured hardware specifications' })
  upsertSpec(
    @Param('id') id: string,
    @Param('componentType') componentType: string,
    @CurrentUser() actor: any,
    @Body() specData: any,
  ) {
    return this.productsService.upsertSpecification(id, componentType, specData, actor);
  }
}

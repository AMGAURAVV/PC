import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { AdminPaginationDto } from './admin-common.dto';

export class AdminProductFilterDto extends AdminPaginationDto {
  @ApiPropertyOptional({ description: 'Filter by category slug or ID' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Filter by brand slug or ID' })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiPropertyOptional({ description: 'Filter by component type' })
  @IsOptional()
  @IsString()
  componentType?: string;

  @ApiPropertyOptional({ description: 'Filter draft state' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isDraft?: boolean;

  @ApiPropertyOptional({ description: 'Filter active state' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Filter featured state' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({ enum: ['IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK'] })
  @IsOptional()
  @IsString()
  stockStatus?: string;
}

export class AdminCreateProductDto {
  @ApiProperty({ example: 'AMD Ryzen 7 7800X3D' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: '8-core gaming processor' })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiPropertyOptional({ example: 'Ultimate gaming CPU' })
  @IsOptional()
  @IsString()
  shortDescription?: string;

  @ApiProperty({ example: 'CPU' })
  @IsString()
  @IsNotEmpty()
  componentType!: string;

  @ApiProperty({ example: 'brand-amd-uuid' })
  @IsString()
  @IsNotEmpty()
  brandId!: string;

  @ApiPropertyOptional({ example: '100-100000910WOF' })
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiPropertyOptional({ example: '730143314930' })
  @IsOptional()
  @IsString()
  barcode?: string;

  @ApiPropertyOptional({ example: '7800X3D' })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({ example: 0.15 })
  @IsOptional()
  @IsNumber()
  weight?: number;

  @ApiPropertyOptional({ example: ['gaming', 'am5'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ example: ['cat-processors-uuid'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categoryIds?: string[];

  @ApiPropertyOptional({ example: 'cat-processors-uuid' })
  @IsOptional()
  @IsString()
  primaryCategoryId?: string;

  @ApiProperty({ example: 449.99 })
  @IsNumber()
  @Min(0)
  basePrice!: number;

  @ApiPropertyOptional({ example: 499.99 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  compareAtPrice?: number;

  @ApiPropertyOptional({ example: 'INR' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ example: 25 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  initialStock?: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isDraft?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;
}

export class AdminUpdateProductDto {
  @ApiPropertyOptional({ description: 'Expected ISO updatedAt timestamp for optimistic concurrency' })
  @IsOptional()
  @IsString()
  expectedUpdatedAt?: string;

  @ApiPropertyOptional({ example: 'AMD Ryzen 7 7800X3D' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'amd-ryzen-7-7800x3d' })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional({ example: 'Updated description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'Updated short description' })
  @IsOptional()
  @IsString()
  shortDescription?: string;

  @ApiPropertyOptional({ example: '7800X3D' })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({ example: '100-100000910WOF' })
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiPropertyOptional({ example: '730143314930' })
  @IsOptional()
  @IsString()
  barcode?: string;

  @ApiPropertyOptional({ example: 'brand-amd-uuid' })
  @IsOptional()
  @IsString()
  brandId?: string;

  @ApiPropertyOptional({ example: 449.99 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  basePrice?: number;

  @ApiPropertyOptional({ example: 499.99 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  compareAtPrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isDraft?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  weight?: number;

  @ApiPropertyOptional({ example: ['gaming', 'am5'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categoryIds?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  primaryCategoryId?: string;
}

export enum BulkProductStatusAction {
  PUBLISH = 'PUBLISH',
  ARCHIVE = 'ARCHIVE',
  DRAFT = 'DRAFT',
  FEATURE = 'FEATURE',
  UNFEATURE = 'UNFEATURE',
}

export class BulkProductStatusDto {
  @ApiProperty({ example: ['prod-1', 'prod-2'] })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  productIds!: string[];

  @ApiProperty({ enum: BulkProductStatusAction })
  @IsEnum(BulkProductStatusAction)
  action!: BulkProductStatusAction;
}

export class BulkProductDeleteDto {
  @ApiProperty({ example: ['prod-1', 'prod-2'] })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  productIds!: string[];

  @ApiPropertyOptional({ default: false, description: 'Force deletion even if soft delete is possible' })
  @IsOptional()
  @IsBoolean()
  force?: boolean;
}

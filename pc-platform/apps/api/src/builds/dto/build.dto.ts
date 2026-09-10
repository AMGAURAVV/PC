import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type {
  CompatibilityStatus,
  CompatibilityIssueItem,
  CompatibilityResult,
} from '@pc-platform/types';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

export enum BuildStatusDto {
  DRAFT = 'DRAFT',
  COMPLETE = 'COMPLETE',
  ORDERED = 'ORDERED',
  ARCHIVED = 'ARCHIVED',
}

export class EvaluateBuildItemDto {
  @ApiProperty({ description: 'Product UUID', example: 'd3b07384-d113-4a44-93ff-183cf99f6420' })
  @IsUUID()
  @IsNotEmpty()
  productId!: string;

  @ApiPropertyOptional({ description: 'Quantity of component', example: 1, default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number = 1;
}

export class EvaluateBuildDto {
  @ApiProperty({ type: [EvaluateBuildItemDto], description: 'Components to evaluate' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EvaluateBuildItemDto)
  items!: EvaluateBuildItemDto[];
}

export class AddBuildItemDto {
  @ApiProperty({ description: 'Product UUID to add to build', example: 'd3b07384-d113-4a44-93ff-183cf99f6420' })
  @IsUUID()
  @IsNotEmpty()
  productId!: string;

  @ApiPropertyOptional({ description: 'Optional Product Variant UUID', example: 'c2b07384-d113-4a44-93ff-183cf99f6421' })
  @IsOptional()
  @IsUUID()
  productVariantId?: string;

  @ApiPropertyOptional({ description: 'Quantity of component', example: 1, default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number = 1;

  @ApiPropertyOptional({ description: 'Display sort order', example: 0, default: 0 })
  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @ApiPropertyOptional({ description: 'User notes on this component', example: 'Purchasing during sale' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateBuildItemDto {
  @ApiPropertyOptional({ description: 'Replace with another Product UUID', example: 'd3b07384-d113-4a44-93ff-183cf99f6420' })
  @IsOptional()
  @IsUUID()
  productId?: string;

  @ApiPropertyOptional({ description: 'Product Variant UUID' })
  @IsOptional()
  @IsUUID()
  productVariantId?: string;

  @ApiPropertyOptional({ description: 'Quantity', example: 2 })
  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;

  @ApiPropertyOptional({ description: 'Display sort order', example: 1 })
  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @ApiPropertyOptional({ description: 'User notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class ReplaceBuildItemDto {
  @ApiProperty({ description: 'New Product UUID to replace current component', example: 'a1b07384-d113-4a44-93ff-183cf99f6429' })
  @IsUUID()
  @IsNotEmpty()
  newProductId!: string;

  @ApiPropertyOptional({ description: 'New Product Variant UUID' })
  @IsOptional()
  @IsUUID()
  newProductVariantId?: string;

  @ApiPropertyOptional({ description: 'New quantity', example: 1, default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;

  @ApiPropertyOptional({ description: 'Updated notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class ReorderItemEntryDto {
  @ApiProperty({ description: 'Build item UUID', example: 'b5a07384-d113-4a44-93ff-183cf99f6430' })
  @IsUUID()
  @IsNotEmpty()
  itemId!: string;

  @ApiProperty({ description: 'Zero-based sort index', example: 0 })
  @IsInt()
  sortOrder!: number;
}

export class ReorderBuildItemsDto {
  @ApiProperty({ type: [ReorderItemEntryDto], description: 'List of item IDs and their target sort orders' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReorderItemEntryDto)
  items!: ReorderItemEntryDto[];
}

export class SaveBuildVersionDto {
  @ApiPropertyOptional({ description: 'Optional milestone label for this historical version', example: 'Stable RTX 4080 config' })
  @IsOptional()
  @IsString()
  label?: string;
}

export class ShareBuildDto {
  @ApiPropertyOptional({ description: 'Friendly label for the share link', example: 'Reddit build review' })
  @IsOptional()
  @IsString()
  label?: string;

  @ApiPropertyOptional({ description: 'Expiration date/time (ISO 8601)', example: '2026-12-31T23:59:59Z' })
  @IsOptional()
  @IsString()
  expiresAt?: string;

  @ApiPropertyOptional({ description: 'Maximum allowed views before auto-expiry' })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxViews?: number;
}

export class CreateBuildDto {
  @ApiProperty({ example: 'My Custom Gaming PC', description: 'Name of the build' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ example: 'High-end 1440p 240Hz competitive gaming setup', description: 'Description of the build' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: false, description: 'Whether the build is publicly visible' })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({ type: [AddBuildItemDto], description: 'Optional components to add initially' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AddBuildItemDto)
  items?: AddBuildItemDto[];
}

export class UpdateBuildDto {
  @ApiPropertyOptional({ example: 'My Updated Gaming Rig' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'Upgraded with liquid cooling and additional NVMe storage' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({ enum: BuildStatusDto, example: BuildStatusDto.DRAFT })
  @IsOptional()
  @IsEnum(BuildStatusDto)
  status?: BuildStatusDto;
}

// ── Response DTOs ─────────────────────────────────────────────────────────────

export class BuildItemResponseDto {
  @ApiProperty({ example: 'uuid-item' })
  id!: string;

  @ApiProperty({ example: 'uuid-product' })
  productId!: string;

  @ApiPropertyOptional({ example: 'uuid-variant' })
  productVariantId!: string | null;

  @ApiProperty({ example: 'AMD Ryzen 7 7800X3D' })
  productName!: string;

  @ApiProperty({ example: 'amd-ryzen-7-7800x3d' })
  productSlug!: string;

  @ApiProperty({ example: 'CPU' })
  componentType!: string;

  @ApiProperty({ example: 1 })
  quantity!: number;

  @ApiProperty({ example: 38999 })
  unitPrice!: number;

  @ApiProperty({ example: 38999 })
  totalPrice!: number;

  @ApiProperty({ example: 0 })
  sortOrder!: number;

  @ApiPropertyOptional({ example: 'Selected for 3D V-Cache gaming performance' })
  notes!: string | null;

  @ApiPropertyOptional()
  specs?: Record<string, any>;

  @ApiPropertyOptional({ example: 'https://cdn.pc-platform.com/products/cpu.png' })
  imageUrl!: string | null;
}

export class BuildCalculationsDto {
  @ApiProperty({ example: 145000, description: 'Total price of all components in INR' })
  totalPrice!: number;

  @ApiProperty({ example: 485, description: 'Estimated total system peak power in Watts' })
  estimatedPowerW!: number;

  @ApiProperty({ example: 750, description: 'Recommended PSU wattage with safety and transient headroom' })
  recommendedPsuW!: number;

  @ApiProperty({ example: 'compatible', enum: ['compatible', 'incompatible', 'warning', 'unknown'] })
  compatibilityStatus!: CompatibilityStatus;

  @ApiProperty({ type: [Object], description: 'List of compatibility issues or warnings' })
  warnings!: CompatibilityIssueItem[];

  @ApiProperty({ example: 92, description: 'Hardware capability index (0-100 placeholder)' })
  performanceScore!: number;

  @ApiProperty({ example: 88, description: 'Performance per cost index (0-100 placeholder)' })
  valueScore!: number;

  @ApiPropertyOptional({ description: 'Full compatibility engine telemetry & report' })
  compatibilityResult?: CompatibilityResult;
}

export class BuildResponseDto {
  @ApiProperty({ example: 'uuid-build' })
  id!: string;

  @ApiProperty({ example: 'uuid-user' })
  userId!: string;

  @ApiProperty({ example: 'My Custom Gaming PC' })
  name!: string;

  @ApiPropertyOptional({ example: 'High-end 1440p gaming setup' })
  description!: string | null;

  @ApiProperty({ example: 'DRAFT' })
  status!: string;

  @ApiProperty({ example: false })
  isPublic!: boolean;

  @ApiProperty({ type: [BuildItemResponseDto] })
  items!: BuildItemResponseDto[];

  @ApiProperty({ type: BuildCalculationsDto })
  calculations!: BuildCalculationsDto;

  @ApiPropertyOptional({ example: 'https://pcplatform.com/b/a9f8b2c1' })
  shareUrl!: string | null;

  @ApiPropertyOptional({ example: 'a9f8b2c1' })
  activeShareToken!: string | null;

  @ApiProperty({ example: 3, description: 'Number of saved immutable historical versions' })
  versionsCount!: number;

  @ApiProperty({ example: '2026-09-09T04:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-09-09T04:15:00.000Z' })
  updatedAt!: string;
}

export class BuildVersionResponseDto {
  @ApiProperty({ example: 'uuid-version' })
  id!: string;

  @ApiProperty({ example: 'uuid-build' })
  buildId!: string;

  @ApiProperty({ example: 1 })
  versionNumber!: number;

  @ApiPropertyOptional({ example: 'Before GPU upgrade' })
  label!: string | null;

  @ApiProperty({ description: 'Full immutable snapshot of build, components, prices, and compatibility status' })
  snapshot!: any;

  @ApiPropertyOptional({ example: 'uuid-user' })
  createdBy!: string | null;

  @ApiProperty({ example: '2026-09-09T04:10:00.000Z' })
  createdAt!: string;
}

export class SharedBuildResponseDto {
  @ApiProperty({ example: 'x8k9m2p1' })
  token!: string;

  @ApiProperty({ type: BuildResponseDto })
  build!: BuildResponseDto;

  @ApiPropertyOptional({ example: 'Shared with friend' })
  label!: string | null;

  @ApiProperty({ example: 42 })
  viewCount!: number;

  @ApiPropertyOptional({ example: '2026-12-31T23:59:59.000Z' })
  expiresAt!: string | null;

  @ApiProperty({ example: '2026-09-09T04:12:00.000Z' })
  createdAt!: string;
}

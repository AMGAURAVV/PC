import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

import { AdminPaginationDto } from './admin-common.dto';

export class AdminInventoryFilterDto extends AdminPaginationDto {
  @ApiPropertyOptional({ description: 'Filter only low stock items' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  lowStockOnly?: boolean;

  @ApiPropertyOptional({ description: 'Filter only out of stock items' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  outOfStockOnly?: boolean;

  @ApiPropertyOptional({ description: 'Filter by supplier ID' })
  @IsOptional()
  @IsString()
  supplierId?: string;

  @ApiPropertyOptional({ description: 'Filter by component type' })
  @IsOptional()
  @IsString()
  componentType?: string;
}

export enum StockAdjustmentType {
  RESTOCK = 'RESTOCK',
  CORRECTION = 'CORRECTION',
  DAMAGE = 'DAMAGE',
  RETURN = 'RETURN',
  AUDIT_COUNT = 'AUDIT_COUNT',
}

export class StockAdjustmentDto {
  @ApiProperty({ example: 'prod-uuid-1' })
  @IsString()
  @IsNotEmpty()
  productId!: string;

  @ApiPropertyOptional({ example: 'var-uuid-1' })
  @IsOptional()
  @IsString()
  variantId?: string;

  @ApiPropertyOptional({ example: 'supp-uuid-1' })
  @IsOptional()
  @IsString()
  supplierId?: string;

  @ApiProperty({ example: 10, description: 'Positive to add stock, negative to reduce' })
  @IsInt()
  quantityDelta!: number;

  @ApiProperty({ enum: StockAdjustmentType, example: StockAdjustmentType.RESTOCK })
  @IsEnum(StockAdjustmentType)
  type!: StockAdjustmentType;

  @ApiProperty({ example: 'Supplier PO #1024 shipment received' })
  @IsString()
  @IsNotEmpty()
  reason!: string;
}

export class BulkStockAdjustmentDto {
  @ApiProperty({ type: [StockAdjustmentDto] })
  @IsArray()
  adjustments!: StockAdjustmentDto[];
}

export class UpdateStockThresholdDto {
  @ApiProperty({ example: 5 })
  @IsInt()
  @Min(0)
  lowStockThreshold!: number;
}

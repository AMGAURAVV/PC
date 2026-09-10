import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

import { AdminPaginationDto } from './admin-common.dto';

export enum AdminPriceType {
  RETAIL = 'RETAIL',
  SALE = 'SALE',
  WHOLESALE = 'WHOLESALE',
  MAP = 'MAP',
  MSRP = 'MSRP',
}

export class AdminCreatePriceDto {
  @ApiProperty({ example: 'prod-uuid-1' })
  @IsString()
  @IsNotEmpty()
  productId!: string;

  @ApiPropertyOptional({ example: 'var-uuid-1' })
  @IsOptional()
  @IsString()
  variantId?: string;

  @ApiProperty({ enum: AdminPriceType, default: AdminPriceType.RETAIL })
  @IsEnum(AdminPriceType)
  priceType: AdminPriceType = AdminPriceType.RETAIL;

  @ApiProperty({ example: 449.99 })
  @IsNumber()
  @Min(0)
  amount!: number;

  @ApiPropertyOptional({ example: 499.99 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  compareAt?: number;

  @ApiPropertyOptional({ default: 'INR' })
  @IsOptional()
  @IsString()
  currency?: string = 'INR';

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endsAt?: string;

  @ApiPropertyOptional({ example: 'Initial catalog pricing' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class AdminUpdatePriceDto {
  @ApiPropertyOptional({ example: 399.99 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @ApiPropertyOptional({ example: 499.99 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  compareAt?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endsAt?: string;

  @ApiPropertyOptional({ example: 'Summer discount promotion' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export enum BulkPriceAdjustmentType {
  PERCENTAGE = 'PERCENTAGE', // e.g. -10% or +5%
  FIXED_AMOUNT = 'FIXED_AMOUNT', // e.g. -50 or +20
  SET_FIXED = 'SET_FIXED', // set all to exact value
}

export class BulkPriceUpdateDto {
  @ApiProperty({ example: ['prod-uuid-1', 'prod-uuid-2'] })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  productIds!: string[];

  @ApiProperty({ enum: BulkPriceAdjustmentType })
  @IsEnum(BulkPriceAdjustmentType)
  adjustmentType!: BulkPriceAdjustmentType;

  @ApiProperty({ example: -10, description: 'Percentage or fixed value delta' })
  @IsNumber()
  adjustmentValue!: number;

  @ApiPropertyOptional({ enum: AdminPriceType, default: AdminPriceType.RETAIL })
  @IsOptional()
  @IsEnum(AdminPriceType)
  priceType?: AdminPriceType = AdminPriceType.RETAIL;

  @ApiProperty({ example: 'Seasonal discount campaign' })
  @IsString()
  @IsNotEmpty()
  reason!: string;
}

export class PriceHistoryFilterDto extends AdminPaginationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  productId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  variantId?: string;
}

export class AdminCorrectPriceHistoryDto {
  @ApiProperty({ example: 42999.00, description: 'Corrected price amount' })
  @IsNumber()
  @Min(0)
  amount!: number;

  @ApiProperty({
    example: 'Typo in seasonal import; corrected from 429990 to 42999',
    description: 'Mandatory justification for correcting historical data',
  })
  @IsString()
  @IsNotEmpty()
  reason!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  effectiveDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;
}


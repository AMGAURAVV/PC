import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreatePriceDto {
  @ApiProperty({ example: 'uuid-product' })
  @IsUUID()
  @IsNotEmpty()
  productId!: string;

  @ApiPropertyOptional({ example: 'uuid-variant' })
  @IsOptional()
  @IsUUID()
  productVariantId?: string;

  @ApiProperty({ example: 449.99 })
  @IsNumber()
  amount!: number;

  @ApiPropertyOptional({ example: 'INR', default: 'INR' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ example: 'ADMIN_UPDATE' })
  @IsOptional()
  @IsString()
  source?: string;

  @ApiPropertyOptional({ example: 'Fall promotion' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  effectiveDate?: string;
}

export class PriceResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  productId!: string;

  @ApiPropertyOptional()
  variantId?: string;

  @ApiProperty()
  amount!: number;

  @ApiProperty({ default: 'INR' })
  currency!: string;

  @ApiProperty()
  source!: string;

  @ApiProperty()
  effectiveDate!: string;

  @ApiPropertyOptional()
  endDate?: string | null;

  @ApiProperty()
  createdAt!: string;
}

export class PriceHistoryItemDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  productId!: string;

  @ApiPropertyOptional()
  variantId?: string | null;

  @ApiProperty({ description: 'Primary price value in INR' })
  price!: number;

  @ApiProperty({ description: 'Raw amount' })
  amount!: number;

  @ApiProperty({ default: 'INR' })
  currency!: string;

  @ApiProperty({ example: 'ADMIN_UPDATE' })
  source!: string;

  @ApiProperty()
  effectiveDate!: string;

  @ApiPropertyOptional()
  endDate?: string | null;

  @ApiPropertyOptional()
  reason?: string | null;

  @ApiProperty()
  isCorrection!: boolean;

  @ApiPropertyOptional()
  originalAmount?: number | null;

  @ApiPropertyOptional()
  correctionReason?: string | null;

  @ApiPropertyOptional()
  correctedBy?: string | null;

  @ApiPropertyOptional()
  correctedAt?: string | null;

  @ApiProperty()
  createdAt!: string;
}

export class ProductPriceSummaryResponseDto {
  @ApiProperty()
  productId!: string;

  @ApiPropertyOptional()
  variantId?: string | null;

  @ApiProperty({ default: 'INR' })
  currency!: string;

  @ApiProperty({ description: 'Currently active price' })
  currentPrice!: number;

  @ApiProperty({ description: 'All-time lowest recorded price' })
  lowestPrice!: number;

  @ApiProperty({ description: 'All-time highest recorded price' })
  highestPrice!: number;

  @ApiPropertyOptional({ description: 'Average historical price' })
  averagePrice?: number;

  @ApiProperty({ type: [PriceHistoryItemDto] })
  priceHistory!: PriceHistoryItemDto[];

  @ApiProperty({ description: 'Total historical records count' })
  total!: number;
}

export class PriceHistoryQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  variantId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 50;
}

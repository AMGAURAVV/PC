import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

import { AdminPaginationDto } from './admin-common.dto';

export enum AdminCouponType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED_AMOUNT = 'FIXED_AMOUNT',
  FREE_SHIPPING = 'FREE_SHIPPING',
}

export class CreateCouponDto {
  @ApiProperty({ example: 'SUMMER2026' })
  @IsString()
  @IsNotEmpty()
  code!: string;

  @ApiPropertyOptional({ example: '10% off entire store' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: AdminCouponType, example: AdminCouponType.PERCENTAGE })
  @IsEnum(AdminCouponType)
  couponType!: AdminCouponType;

  @ApiProperty({ example: 10, description: 'Percentage or fixed amount' })
  @IsNumber()
  @Min(0)
  value!: number;

  @ApiPropertyOptional({ example: 50 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minOrderAmount?: number;

  @ApiPropertyOptional({ example: 100, description: 'Cap on discount amount' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxDiscountAmount?: number;

  @ApiPropertyOptional({ default: 'INR' })
  @IsOptional()
  @IsString()
  currency?: string = 'INR';

  @ApiPropertyOptional({ example: 500, description: 'Total max uses across all users' })
  @IsOptional()
  @IsInt()
  @Min(1)
  usageLimit?: number;

  @ApiPropertyOptional({ example: 1, description: 'Max uses per user' })
  @IsOptional()
  @IsInt()
  @Min(1)
  usagePerUser?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional({ example: [] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  applicableToProductIds?: string[];

  @ApiPropertyOptional({ example: [] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  applicableToCategoryIds?: string[];

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}

export class UpdateCouponDto {
  @ApiPropertyOptional({ example: 'SUMMER2026' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: AdminCouponType })
  @IsOptional()
  @IsEnum(AdminCouponType)
  couponType?: AdminCouponType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  value?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  minOrderAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxDiscountAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  usageLimit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  usagePerUser?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  applicableToProductIds?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  applicableToCategoryIds?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class BulkCouponStatusDto {
  @ApiProperty({ example: ['coupon-1', 'coupon-2'] })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  couponIds!: string[];

  @ApiProperty({ example: true })
  @IsBoolean()
  isActive!: boolean;
}

export class CouponFilterDto extends AdminPaginationDto {
  @ApiPropertyOptional({ enum: AdminCouponType })
  @IsOptional()
  @IsEnum(AdminCouponType)
  couponType?: AdminCouponType;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;
}

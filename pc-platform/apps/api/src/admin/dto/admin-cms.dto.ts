import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

import { AdminPaginationDto } from './admin-common.dto';

export class CreateBannerDto {
  @ApiProperty({ example: 'Next-Gen RTX 50-Series Launch' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiPropertyOptional({ example: 'Experience unmatched fidelity and generative power' })
  @IsOptional()
  @IsString()
  subtitle?: string;

  @ApiProperty({ example: 'https://images.example.com/banners/rtx-50-hero.webp' })
  @IsString()
  @IsNotEmpty()
  imageUrl!: string;

  @ApiPropertyOptional({ example: 'https://images.example.com/banners/rtx-50-mobile.webp' })
  @IsOptional()
  @IsString()
  mobileImageUrl?: string;

  @ApiPropertyOptional({ example: '/products?category=graphics-cards' })
  @IsOptional()
  @IsString()
  linkUrl?: string;

  @ApiPropertyOptional({ default: 'hero', description: 'hero, promo_top, promo_bottom, sidebar' })
  @IsOptional()
  @IsString()
  position?: string = 'hero';

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number = 0;

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
}

export class UpdateBannerDto {
  @ApiPropertyOptional({ example: 'Next-Gen RTX 50-Series Launch' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subtitle?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  mobileImageUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  linkUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  position?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  sortOrder?: number;

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
}

export class BannerFilterDto extends AdminPaginationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  position?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;
}

export class CreateHomepageSectionDto {
  @ApiProperty({ example: 'Featured Gaming Components' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ example: 'featured_products' })
  @IsString()
  @IsNotEmpty()
  sectionKey!: string;

  @ApiProperty({ example: 'product_grid', description: 'banner_slider, product_grid, category_grid, text_block' })
  @IsString()
  @IsNotEmpty()
  type!: string;

  @ApiPropertyOptional({ description: 'JSON configuration object with filter parameters or static IDs' })
  @IsOptional()
  config?: any;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number = 0;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}

export class UpdateHomepageSectionDto {
  @ApiPropertyOptional({ example: 'Featured Gaming Components' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: 'product_grid' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  config?: any;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class SetFeaturedProductsDto {
  @ApiProperty({ example: ['prod-uuid-1', 'prod-uuid-2'], description: 'List of product IDs to feature' })
  @IsArray()
  @IsString({ each: true })
  productIds!: string[];
}

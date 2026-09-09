import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { ProductImageResponseDto } from './product-image.dto';
import { ProductVariantResponseDto } from './product-variant.dto';

export class CreateProductDto {
  @ApiProperty({ example: 'Ryzen 7 7800X3D' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'AMD Ryzen 7 7800X3D 8-Core 16-Thread Desktop Processor' })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiPropertyOptional({ example: 'Ultimate gaming processor with 3D V-Cache technology' })
  @IsOptional()
  @IsString()
  shortDescription?: string | undefined;

  @ApiProperty({ example: 'CPU', description: 'Hardware component type enum' })
  @IsString()
  @IsNotEmpty()
  componentType!: string;

  @ApiProperty({ example: 'uuid-brand-id' })
  @IsString()
  @IsNotEmpty()
  brandId!: string;

  @ApiPropertyOptional({ example: '100-100000910WOF' })
  @IsOptional()
  @IsString()
  sku?: string | undefined;

  @ApiPropertyOptional({ example: '730143314930' })
  @IsOptional()
  @IsString()
  barcode?: string | undefined;

  @ApiPropertyOptional({ example: '7800X3D' })
  @IsOptional()
  @IsString()
  model?: string | undefined;

  @ApiPropertyOptional({ example: 0.15, description: 'Weight in kg' })
  @IsOptional()
  @IsNumber()
  weight?: number | undefined;

  @ApiPropertyOptional({ example: ['gaming', 'am5', 'x3d', 'zen4'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[] | undefined;

  @ApiPropertyOptional({ example: ['uuid-cat-processors', 'uuid-cat-gaming'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categoryIds?: string[] | undefined;

  @ApiPropertyOptional({ example: 'uuid-cat-processors' })
  @IsOptional()
  @IsString()
  primaryCategoryId?: string | undefined;

  @ApiProperty({ example: 449.99, description: 'Active retail price' })
  @IsNumber()
  @Min(0)
  basePrice!: number;

  @ApiPropertyOptional({ example: 499.99, description: 'Compare at price (original MSRP)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  compareAtPrice?: number | undefined;

  @ApiPropertyOptional({ example: 'USD' })
  @IsOptional()
  @IsString()
  currency?: string | undefined;

  @ApiPropertyOptional({ example: 50, description: 'Initial stock quantity' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  initialStock?: number | undefined;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean | undefined;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isDraft?: boolean | undefined;

  @ApiPropertyOptional({ example: 'AMD Ryzen 7 7800X3D Gaming Processor | Best Price' })
  @IsOptional()
  @IsString()
  metaTitle?: string | undefined;

  @ApiPropertyOptional({ example: 'Buy the AMD Ryzen 7 7800X3D 8-Core processor with 3D V-Cache.' })
  @IsOptional()
  @IsString()
  metaDescription?: string | undefined;
}

export class UpdateProductDto {
  @ApiPropertyOptional({ example: 'Ryzen 7 7800X3D' })
  @IsOptional()
  @IsString()
  name?: string | undefined;

  @ApiPropertyOptional({ example: 'Updated processor description' })
  @IsOptional()
  @IsString()
  description?: string | undefined;

  @ApiPropertyOptional({ example: 'Short description' })
  @IsOptional()
  @IsString()
  shortDescription?: string | undefined;

  @ApiPropertyOptional({ example: '7800X3D' })
  @IsOptional()
  @IsString()
  model?: string | undefined;

  @ApiPropertyOptional({ example: '100-100000910WOF' })
  @IsOptional()
  @IsString()
  sku?: string | undefined;

  @ApiPropertyOptional({ example: '730143314930' })
  @IsOptional()
  @IsString()
  barcode?: string | undefined;

  @ApiPropertyOptional({ example: 429.99 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  basePrice?: number | undefined;

  @ApiPropertyOptional({ example: 499.99 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  compareAtPrice?: number | undefined;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean | undefined;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isDraft?: boolean | undefined;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean | undefined;

  @ApiPropertyOptional({ example: ['gaming', 'am5'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[] | undefined;

  @ApiPropertyOptional({ example: ['uuid-cat-1'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categoryIds?: string[] | undefined;

  @ApiPropertyOptional({ example: 'uuid-cat-1' })
  @IsOptional()
  @IsString()
  primaryCategoryId?: string | undefined;

  @ApiPropertyOptional({ example: 0.15 })
  @IsOptional()
  @IsNumber()
  weight?: number | undefined;

  @ApiPropertyOptional({ example: 'Meta title' })
  @IsOptional()
  @IsString()
  metaTitle?: string | undefined;

  @ApiPropertyOptional({ example: 'Meta description' })
  @IsOptional()
  @IsString()
  metaDescription?: string | undefined;
}

export class ProductPriceDto {
  @ApiProperty({ example: 449.99 })
  amount!: number;

  @ApiPropertyOptional({ example: 499.99 })
  compareAt?: number | null | undefined;

  @ApiProperty({ example: 'INR' })
  currency!: string;

  @ApiPropertyOptional({ example: 10, description: 'Percentage savings if compareAt is higher' })
  discountPercent?: number | null | undefined;

  @ApiProperty({ example: 'RETAIL' })
  priceType!: string;
}

export class ProductInventoryDto {
  @ApiProperty({ example: true })
  inStock!: boolean;

  @ApiProperty({ example: 50 })
  totalQuantity!: number;

  @ApiProperty({ example: 2 })
  reservedQuantity!: number;

  @ApiProperty({ example: 48 })
  availableQuantity!: number;

  @ApiProperty({ example: 'IN_STOCK', enum: ['IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK'] })
  stockStatus!: string;
}

export class ProductResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty()
  sku!: string;

  @ApiPropertyOptional()
  barcode?: string | null | undefined;

  @ApiProperty()
  description!: string;

  @ApiPropertyOptional()
  shortDescription?: string | null | undefined;

  @ApiPropertyOptional()
  model?: string | null | undefined;

  @ApiProperty({ example: 'CPU' })
  componentType!: string;

  @ApiProperty()
  brand!: {
    id: string;
    name: string;
    slug: string;
    logoUrl?: string | null;
  };

  @ApiPropertyOptional()
  primaryCategory?: {
    id: string;
    name: string;
    slug: string;
  } | null | undefined;

  @ApiProperty({ type: [Object] })
  categories!: Array<{
    id: string;
    name: string;
    slug: string;
    isPrimary: boolean;
  }>;

  @ApiPropertyOptional({ type: () => ProductPriceDto })
  price?: ProductPriceDto | null | undefined;

  @ApiPropertyOptional({
    description: 'Price range across variants',
    example: { minPrice: 399.99, maxPrice: 449.99 },
  })
  variantPriceRange?: { minPrice: number; maxPrice: number } | null | undefined;

  @ApiProperty({ type: () => ProductInventoryDto })
  inventory!: ProductInventoryDto;

  @ApiPropertyOptional({ type: () => ProductImageResponseDto })
  primaryImage?: ProductImageResponseDto | null | undefined;

  @ApiProperty({ type: [ProductImageResponseDto] })
  images!: ProductImageResponseDto[];

  @ApiProperty({ type: [ProductVariantResponseDto] })
  variants!: ProductVariantResponseDto[];

  @ApiPropertyOptional({ description: 'Normalized component specification data' })
  specifications?: Record<string, any> | undefined;

  @ApiProperty()
  tags!: string[];

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty()
  isDraft!: boolean;

  @ApiProperty()
  isFeatured!: boolean;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

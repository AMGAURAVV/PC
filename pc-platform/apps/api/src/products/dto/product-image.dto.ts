import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsUrl,
  Min,
} from 'class-validator';

export class CreateProductImageDto {
  @ApiProperty({ example: 'https://images.pcplatform.com/products/ryzen-7-7800x3d-front.jpg' })
  @IsString()
  @IsNotEmpty()
  url!: string;

  @ApiPropertyOptional({ example: 'AMD Ryzen 7 7800X3D Retail Box Front View' })
  @IsOptional()
  @IsString()
  altText?: string | undefined;

  @ApiPropertyOptional({ example: true, description: 'Mark this image as primary product thumbnail' })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean | undefined;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number | undefined;

  @ApiPropertyOptional({ example: 'uuid-variant-id' })
  @IsOptional()
  @IsString()
  variantId?: string | undefined;

  @ApiPropertyOptional({ example: 1200 })
  @IsOptional()
  @IsInt()
  width?: number | undefined;

  @ApiPropertyOptional({ example: 1200 })
  @IsOptional()
  @IsInt()
  height?: number | undefined;

  @ApiPropertyOptional({ example: 'image/jpeg' })
  @IsOptional()
  @IsString()
  mimeType?: string | undefined;
}

export class ProductImageResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  productId!: string;

  @ApiPropertyOptional()
  variantId?: string | null | undefined;

  @ApiProperty()
  url!: string;

  @ApiPropertyOptional()
  altText?: string | null | undefined;

  @ApiProperty()
  isPrimary!: boolean;

  @ApiProperty()
  sortOrder!: number;

  @ApiPropertyOptional()
  width?: number | null | undefined;

  @ApiPropertyOptional()
  height?: number | null | undefined;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateProductVariantDto {
  @ApiProperty({ example: 'Arctic White / 32GB' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'RAM-COR-DDR5-32-WHT' })
  @IsString()
  @IsNotEmpty()
  sku!: string;

  @ApiPropertyOptional({ example: '840006699881' })
  @IsOptional()
  @IsString()
  barcode?: string | undefined;

  @ApiPropertyOptional({
    example: { color: 'White', capacity: '32GB', speed: '6000MHz' },
    description: 'Arbitrary variant attributes',
  })
  @IsOptional()
  @IsObject()
  attributes?: Record<string, any> | undefined;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  sortOrder?: number | undefined;

  @ApiPropertyOptional({ example: 129.99, description: 'Retail price' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number | undefined;

  @ApiPropertyOptional({ example: 149.99, description: 'Compare at price' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  compareAt?: number | undefined;

  @ApiPropertyOptional({ example: 25, description: 'Initial inventory quantity' })
  @IsOptional()
  @IsInt()
  @Min(0)
  initialStock?: number | undefined;
}

export class UpdateProductVariantDto {
  @ApiPropertyOptional({ example: 'Arctic White / 32GB' })
  @IsOptional()
  @IsString()
  name?: string | undefined;

  @ApiPropertyOptional({ example: 'RAM-COR-DDR5-32-WHT' })
  @IsOptional()
  @IsString()
  sku?: string | undefined;

  @ApiPropertyOptional({ example: '840006699881' })
  @IsOptional()
  @IsString()
  barcode?: string | undefined;

  @ApiPropertyOptional({ example: { color: 'White' } })
  @IsOptional()
  @IsObject()
  attributes?: Record<string, any> | undefined;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean | undefined;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  sortOrder?: number | undefined;

  @ApiPropertyOptional({ example: 129.99 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number | undefined;

  @ApiPropertyOptional({ example: 149.99 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  compareAt?: number | undefined;
}

export class ProductVariantResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  productId!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  sku!: string;

  @ApiPropertyOptional()
  barcode?: string | null | undefined;

  @ApiProperty()
  attributes!: Record<string, any>;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty()
  sortOrder!: number;

  @ApiPropertyOptional({ example: 129.99 })
  price?: number | null | undefined;

  @ApiPropertyOptional({ example: 149.99 })
  compareAt?: number | null | undefined;

  @ApiPropertyOptional({ example: 25 })
  availableStock?: number | undefined;

  @ApiPropertyOptional({ example: 'IN_STOCK' })
  stockStatus?: string | undefined;
}

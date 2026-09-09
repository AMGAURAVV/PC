import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsNotEmpty, IsString } from 'class-validator';

export class CompareProductsQueryDto {
  @ApiProperty({
    example: ['uuid-prod-1', 'uuid-prod-2'],
    description: 'Array or comma-separated list of 2 to 5 product IDs to compare',
  })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map((id: string) => id.trim()).filter(Boolean);
    }
    return value;
  })
  @IsArray()
  @ArrayMinSize(2, { message: 'You must provide at least 2 product IDs to compare' })
  @ArrayMaxSize(5, { message: 'You cannot compare more than 5 products at once' })
  @IsString({ each: true })
  ids!: string[];
}

export class ComparisonProductItemDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty()
  sku!: string;

  @ApiProperty()
  componentType!: string;

  @ApiProperty()
  brand!: { id: string; name: string; slug: string; logoUrl?: string | null };

  @ApiPropertyOptional()
  primaryImageUrl?: string | null | undefined;

  @ApiPropertyOptional()
  price?: number | null | undefined;

  @ApiPropertyOptional()
  compareAt?: number | null | undefined;

  @ApiPropertyOptional()
  discountPercent?: number | null | undefined;

  @ApiProperty()
  inStock!: boolean;

  @ApiProperty()
  stockStatus!: string;

  @ApiProperty()
  specifications!: Record<string, any>;
}

export class ProductComparisonResponseDto {
  @ApiProperty({ type: [ComparisonProductItemDto] })
  products!: ComparisonProductItemDto[];

  @ApiProperty({
    example: ['cores', 'threads', 'baseClockMhz', 'tdpW'],
    description: 'List of all specification keys evaluated across compared products',
  })
  allSpecKeys!: string[];

  @ApiProperty({
    example: ['baseClockMhz', 'tdpW'],
    description: 'List of specification keys where values differ across compared products',
  })
  differenceKeys!: string[];

  @ApiProperty({ example: true })
  isSameComponentType!: boolean;
}

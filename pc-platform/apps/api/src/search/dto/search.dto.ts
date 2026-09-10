import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  Max,
} from 'class-validator';

export const SearchSortOptions = [
  'relevance',
  'price_asc',
  'price_desc',
  'newest',
  'name_asc',
  'name_desc',
] as const;

export type SearchSortBy = (typeof SearchSortOptions)[number];

export class SearchQueryDto {
  @ApiPropertyOptional({ description: 'Search term across name, brand, model, category, specifications' })
  @IsOptional()
  @IsString()
  q?: string | undefined;

  @ApiPropertyOptional({ description: 'Category slug or array of category slugs' })
  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return undefined;
    if (Array.isArray(value)) return value.map(String);
    return [String(value)];
  })
  category?: string[] | undefined;

  @ApiPropertyOptional({ description: 'Brand slug or array of brand slugs' })
  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return undefined;
    if (Array.isArray(value)) return value.map(String);
    return [String(value)];
  })
  brand?: string[] | undefined;

  @ApiPropertyOptional({ description: 'Component type or array of component types (e.g. CPU, GPU)' })
  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return undefined;
    if (Array.isArray(value)) return value.map((v) => String(v).toUpperCase());
    return [String(value).toUpperCase()];
  })
  componentType?: string[] | undefined;

  @ApiPropertyOptional({ description: 'Minimum active retail price' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number | undefined;

  @ApiPropertyOptional({ description: 'Maximum active retail price' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number | undefined;

  @ApiPropertyOptional({ description: 'Filter only in-stock items' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true || value === '1' || value === 1)
  @IsBoolean()
  inStock?: boolean | undefined;

  @ApiPropertyOptional({
    description: 'Sort criteria',
    enum: SearchSortOptions,
    default: 'relevance',
  })
  @IsOptional()
  @IsIn(SearchSortOptions)
  sortBy?: SearchSortBy | undefined = 'relevance';

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number | undefined = 1;

  @ApiPropertyOptional({ description: 'Page size limit', default: 12 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number | undefined = 12;

  @ApiPropertyOptional({ description: 'Optional JSON-encoded specification filter values' })
  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return undefined;
    if (typeof value === 'object') return value;
    try {
      return JSON.parse(value);
    } catch {
      return undefined;
    }
  })
  specs?: Record<string, any> | undefined;
}

export class SuggestQueryDto {
  @ApiPropertyOptional({ description: 'Search prefix/term for suggestions' })
  @IsString()
  q: string = '';

  @ApiPropertyOptional({ description: 'Max suggestions to return', default: 8 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  limit?: number | undefined = 8;
}
